import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../services/websocket.service';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.page.html',
  styleUrls: ['./user-list.page.scss'],
})
export class UserListPage implements OnInit {
  users: any[] = [];

  constructor(private websocketService: WebsocketService, private router: Router) { }

  ngOnInit() {
    this.refreshUsers();
  }

  refreshUsers() {
    this.websocketService.fetchUsers().subscribe(
      (users) => {
        this.users = users;
      },
      (error) => {
        console.error('Error fetching users', error);
      }
    );
  }

  selectUser(userId: number, username: string) {  // Add username as a parameter
    console.log('User selected:', userId);
    this.getLoggedInUser().then((loggedInUser) => {
      console.log('Logged in user:', loggedInUser);
      const loggedInUserId = loggedInUser.userId;
      console.log('Logged in user ID:', loggedInUserId);
      this.websocketService.getThreadId(loggedInUserId, userId).subscribe(
        (response) => {
          const threadId = response.threadId;
          console.log('Received thread ID:', threadId);
          if (threadId) {
            this.router.navigate(['/chat', threadId], { queryParams: { username } });  // Pass username as query parameter
          } else {
            console.error('Thread ID is undefined');
          }
        },
        (error) => {
          console.error('Error fetching thread ID:', error);
        }
      );
    }).catch(error => {
      console.error('Error getting logged in user:', error);
    });
  }

}