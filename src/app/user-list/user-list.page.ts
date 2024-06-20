import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../services/websocket.service';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.page.html',
  styleUrls: ['./user-list.page.scss'],
})
export class UserListPage implements OnInit {
  users: any[] = [];
  loggedInUserId: number | null = null; // Add this line to store the logged-in user ID

  constructor(
    private websocketService: WebsocketService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.checkAndSubmitUser();
    this.getLoggedInUser().then((user) => {
      this.loggedInUserId = user.user_id; // Set the logged-in user ID
      this.refreshUsers();
    });
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

  async getLoggedInUser() {
    const { value } = await Preferences.get({ key: 'user' });
    if (value) {
      const user = JSON.parse(value);
      console.log('Logged in user data:', user); // Add this line for logging
      return user;
    }
    throw new Error('User not found');
  }

  selectUser(userId: number, username: string) {
    console.log('User selected:', userId);
    this.getLoggedInUser().then((loggedInUser) => {
      console.log('Logged in user:', loggedInUser);
      const loggedInUserId = loggedInUser.user_id;
      console.log('userlist page - Logged in user ID:', loggedInUserId);
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

  private checkAndSubmitUser() {
    this.getLoggedInUser().then((user) => {
      const userPayload = {
        id: user.user_id,
        username: user.display_name,
        email: user.user_email,
        token: user.token
      };

      // Add logging for payload
      console.log('Submitting user payload:', userPayload);

      // Check if any required fields are missing
      if (!userPayload.id || !userPayload.username || !userPayload.email || !userPayload.token) {
        console.error('Missing required fields in user payload:', userPayload);
        return; // Early exit if validation fails
      }

      this.http.post('http://174.177.123.253:3107/api/v1/users/check_user', userPayload).pipe(
        catchError((error) => {
          console.error('Error checking/registering user:', error);
          return throwError(() => new Error('Error checking/registering user'));
        })
      ).subscribe((response) => {
        console.log('User check/registration response:', response);
      });
    }).catch(error => {
      console.error('Error retrieving user from local storage:', error);
    });
  }
}
