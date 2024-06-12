import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { Plugins } from '@capacitor/core';
const { Http } = Plugins;

@Component({
  selector: 'app-websocket',
  templateUrl: './websocket.page.html',
  styleUrls: ['./websocket.page.scss'],
})
export class WebsocketPage implements OnInit, OnDestroy {
  message = '';
  threadId = '';
  messages = '';
  private messagesSubscription: Subscription = new Subscription();

  constructor(private websocketService: WebsocketService) {}

  ngOnInit() {
    this.messagesSubscription = this.websocketService.messages$.subscribe(msg => {
      this.messages += `${msg}\n`;
    });
  }

  ngOnDestroy() {
    this.messagesSubscription.unsubscribe();
  }

  openConnection(tk?: string) {
    this.websocketService.initConnection(tk);
  }

  openThreadConnection() {
    if (!this.threadId) {
      this.websocketService.showMessage('Please provide a thread ID');
      return;
    }
    this.websocketService.initConnection('test', this.threadId);
    this.threadId = '';
  }

  closeConnection() {
    this.websocketService.closeConnection();
  }

  sendMessage() {
    if (this.message) {
      this.websocketService.sendMessage(this.message);
      this.message = '';
    }
  }

  async login() {
    try {
      const response = await Http.post({
        url: 'http://localhost:3000/api/v1/users/login',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          username: 'testuser',
          password: 'testpass'
        }
      });

      if (response.status === 200) {
        this.websocketService.showMessage('Logged in');
      } else {
        this.websocketService.showMessage(`Log in error: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      this.websocketService.showMessage(`Log in error: ${errorMessage}`);
    }
  }

  async logout() {
    try {
      this.websocketService.closeConnection();
      const response = await Http.post({
        url: 'http://localhost:3000/api/v1/users/logout',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        this.websocketService.showMessage('Logged out');
      } else {
        this.websocketService.showMessage(`Log out error: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      this.websocketService.showMessage(`Log out error: ${errorMessage}`);
    }
  }
}
