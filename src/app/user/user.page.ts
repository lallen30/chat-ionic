import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      userId: ['', Validators.required],
      username: ['', Validators.required],
      token: ['', Validators.required],
    });
  }

  ngOnInit() { }

  async saveUser() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      await Preferences.set({
        key: 'user',
        value: JSON.stringify({
          userId: userData.userId,
          username: userData.username,
          token: userData.token,
        }),
      });
      console.log('User data saved', userData);
    } else {
      console.log('Please enter all fields');
    }
  }

}
