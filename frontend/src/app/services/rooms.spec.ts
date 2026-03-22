import { TestBed } from '@angular/core/testing';

import { Rooms } from './rooms';

describe('Rooms', () => {
  let service: Rooms;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rooms);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
