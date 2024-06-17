import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';

interface CustomWebSocket extends WebSocket {
  pingTimeout?: number;
}

interface Message {
  senderId: number;
  senderUsername: string;
  content: string;
  threadId: number;
  type?: string; // Add type here to match the messages being sent
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private ws: CustomWebSocket | null = null;
  private messagesSubject = new Subject<Message>();
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) { }

  closeConnection() {
    if (this.ws) {
      this.ws.close();
    }
  }

  showMessage(message: Message) {
    this.messagesSubject.next(message);
  }

  async fetchToken(): Promise<string> {
    const { value } = await Preferences.get({ key: 'user' });
    if (value) {
      const user = JSON.parse(value);
      return user.token;
    }
    throw new Error('Token not found');
  }

  async initConnection(threadId: string) {
    try {
      const token = await this.fetchToken();
      console.log(`Using token for WebSocket connection: ${token}`);
      this.closeConnection();
      const wsUrl = `ws://174.177.123.253:3107/thread/${threadId}?at=${token}`;
      console.log(`Connecting to WebSocket URL: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl) as CustomWebSocket;

      this.ws.addEventListener('error', (error: Event) => {
        console.error('WebSocket error:', error);
        this.showMessage({ senderId: 0, senderUsername: 'system', content: 'WebSocket error', threadId: 0 });
      });

      this.ws.addEventListener('open', () => {
        console.log('WebSocket connection established', threadId);
        // this.showMessage({ senderId: 0, senderUsername: 'system', content: `WebSocket connection established for thread id ${threadId}`, threadId: 0 });
        // this.ws!.send(JSON.stringify({ type: 'join', threadId }));
      });

      this.ws.addEventListener('close', (event: CloseEvent) => {
        console.log('WebSocket connection closed:', event);
        this.showMessage({ senderId: 0, senderUsername: 'system', content: `WebSocket connection closed for thread id ${threadId}`, threadId: 0 });
      });

      this.ws.addEventListener('message', (msg: MessageEvent) => {
        if (this.isBinary(msg.data)) {
          this.heartbeat();
        } else {
          try {
            const data = JSON.parse(msg.data);
            console.log('Received WebSocket message:', data);
            if (data.type === 'threadMessages') {
              data.messages.forEach((message: any) => this.showMessage({
                senderId: message.senderId,
                senderUsername: message.senderUsername,
                content: message.content,
                threadId: message.threadId
              }));
            } else if (data.type === 'message') {
              this.showMessage({
                senderId: data.senderId,
                senderUsername: data.senderUsername,
                content: data.content,
                threadId: data.threadId
              });
            }
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.showMessage({ senderId: 0, senderUsername: 'system', content: 'Failed to initialize WebSocket connection', threadId: 0 });
    }
  }

  sendMessage(message: string, senderId: number, threadId: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const senderUsername = this.getUsernameById(senderId.toString()) || 'unknown';
      const messageObj: Message = { type: 'message', senderId, senderUsername, content: message, threadId };
      this.ws.send(JSON.stringify(messageObj));
    } else {
      this.showMessage({ senderId: 0, senderUsername: 'system', content: 'WebSocket connection not open', threadId: 0 });
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
    return 'username';
  }

  isBinary(data: any): boolean {
    return data instanceof Blob || data instanceof ArrayBuffer;
  }

  heartbeat() {
    if (!this.ws) {
      return;
    } else if (this.ws.pingTimeout) {
      clearTimeout(this.ws.pingTimeout);
    }

    this.ws.pingTimeout = window.setTimeout(() => {
      this.ws?.close();
    }, 6000);

    const data = new Uint8Array(1);
    data[0] = 1;
    this.ws.send(data);
  }

  fetchUsers(): Observable<any[]> {
    return this.http.get<any[]>('http://174.177.123.253:3107/api/v1/users/user_list').pipe(
      catchError((error: any) => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error('Error fetching users'));
      })
    );
  }

  getThreadId(user1Id: number, user2Id: number): Observable<{ threadId: number }> {
    console.log('Requesting thread ID for users', user1Id, 'and', user2Id);
    return this.http.post<{ id: number }>('http://174.177.123.253:3107/api/v1/threads/create', { user1_id: user1Id, user2_id: user2Id }).pipe(
      map(response => {
        console.log('Thread ID response:', response);
        return { threadId: response.id };
      }),
      catchError((error: any) => {
        console.error('Error fetching thread ID', error);
        return throwError(() => new Error('Error fetching thread ID'));
      })
    );
  }
}
