import { TestBed } from '@angular/core/testing';
import { MqttService } from './mqtt';


describe('Mqtt', () => {
  let service: MqttService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MqttService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
