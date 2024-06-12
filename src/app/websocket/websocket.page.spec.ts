import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebsocketPage } from './websocket.page';

describe('WebsocketPage', () => {
  let component: WebsocketPage;
  let fixture: ComponentFixture<WebsocketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WebsocketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
