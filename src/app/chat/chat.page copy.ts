import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebsocketService } from '../services/websocket.service';
import { IonInput } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  @ViewChild('messageInput', { static: false }) messageInput!: IonInput;
  userId: number | null = null;
  threadId: number | null = null;
  messages: any[] = []; // Use an array for messages
  username: string = ''; // Default value to avoid blank

  constructor(private route: ActivatedRoute, public websocketService: WebsocketService) { }

  async ngOnInit() {
    await this.initializeChat();
  }

  async initializeChat() {
    await this.fetchLoggedInUserId();
    await this.fetchUsername();
    const id = this.route.snapshot.paramMap.get('threadId');
    this.threadId = id ? +id : null;
    console.log('Chatting with thread ID:', this.threadId);
    if (this.threadId !== null) {
      this.websocketService.initConnection(this.threadId.toString());
      this.websocketService.messages$.subscribe((message) => {
        if (typeof message === 'object') {
          this.messages.push(message); // Push the message to the array
        }
      });
    }
  }

  async fetchLoggedInUserId() {
    try {
      const { value } = await Preferences.get({ key: 'user' });
      if (value) {
        const loggedInUser = JSON.parse(value);
        this.userId = +loggedInUser.userId; // Ensure this matches your user object structure
        console.log('chat page - Logged in user ID:', this.userId);
      }
    } catch (error) {
      console.error('Error fetching logged in user ID:', error);
    }
  }

  async fetchUsername() {
    try {
      const { value } = await Preferences.get({ key: 'user' });
      if (value) {
        const loggedInUser = JSON.parse(value);
        this.username = loggedInUser.username;
        console.log('chat page - Username:', this.username);
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  }

  sendMessage() {
    const message = this.messageInput.value as string;
    console.log('Sending message:', message);
    if (message && this.userId !== null && this.threadId !== null) {
      const senderUsername = this.websocketService.getUsernameById(this.userId.toString()) || 'unknown';
      const messageObj = {
        senderId: this.userId,
        senderUsername,
        content: message,
        threadId: this.threadId,
      };
      this.websocketService.sendMessage(message, this.userId, this.threadId);
      this.messages.push(messageObj); // Push the sent message to the array
      this.messageInput.value = ''; // Clear the input after sending
    }
  }
}
