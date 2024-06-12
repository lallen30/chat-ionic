import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

interface CustomWebSocket extends WebSocket {
  pingTimeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private ws: CustomWebSocket | null = null;
  private messagesSubject = new Subject<string>();
  public messages$ = this.messagesSubject.asObservable();

  constructor() {}

  closeConnection() {
    if (this.ws) {
      this.ws.close();
    }
  }

  showMessage(message: string) {
    this.messagesSubject.next(message);
  }

  async fetchToken(): Promise<string> {
    const res = await fetch('http://localhost:3333/api/v1/users/token', {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      return data.token;
    }
    throw new Error('Unable to fetch token');
  }

  async initConnection(threadId: string) {
    try {
      const token = await this.fetchToken();
      this.closeConnection();
      const wsUrl = `ws://${window.location.hostname}:3333/thread/${threadId}?at=${token}`;
      console.log(`Connecting to WebSocket URL: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl) as CustomWebSocket;

      this.ws.addEventListener('error', (error: Event) => {
        console.error('WebSocket error:', error);
        this.showMessage('WebSocket error');
      });

      this.ws.addEventListener('open', () => {
        console.log('WebSocket connection established');
        this.showMessage(`WebSocket connection established for thread id ${threadId}`);
        this.ws!.send(JSON.stringify({ type: 'join', threadId }));
      });

      this.ws.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        this.showMessage(`WebSocket connection closed for thread id ${threadId}`);
      });

      this.ws.addEventListener('message', (msg: MessageEvent) => {
        if (this.isBinary(msg.data)) {
          this.heartbeat();
        } else {
          try {
            const data = JSON.parse(msg.data);
            if (data.type === 'threadMessages') {
              data.messages.forEach((message: any) => this.showMessage(`${message.senderUsername}: ${message.content}`));
            } else if (data.type === 'message') {
              this.showMessage(`${data.senderUsername}: ${data.content}`);
            }
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.showMessage('Failed to initialize WebSocket connection');
    }
  }

  sendMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const senderId = this.getCookie('userId') || ''; // Ensure a string is always passed
      const senderUsername = this.getUsernameById(senderId);
      if (senderUsername) {
        this.ws.send(JSON.stringify({ type: 'message', senderId, senderUsername, content: message }));
        // Do not call showMessage here to avoid duplicate messages
      } else {
        this.showMessage('Sender username not found');
      }
    } else {
      this.showMessage('WebSocket connection not open');
    }
  }

  getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift();
    }
    return undefined;
  }

  getUsernameById(userId: string): string | undefined {
    // Assuming you have a method to get the username by userId
    // This should be implemented accordingly
    return 'username'; // Replace with actual logic to get the username
  }

  isBinary(data: any): boolean {
    return data instanceof Blob || data instanceof ArrayBuffer;
  }

  heartbeat() {
    if (!this.ws) {
      return;
    } else if (this.ws.pingTimeout) {
      clearTimeout(this.ws.pingTimeout as number);
    }

    this.ws.pingTimeout = setTimeout(() => {
      this.ws?.close();
    }, 6000);

    const data = new Uint8Array(1);
    data[0] = 1;
    this.ws.send(data);
  }
}
