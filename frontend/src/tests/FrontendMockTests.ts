// Frontend Mock Unit Tests Suite for FireGuard AI React Components
import { z } from 'zod';

// Mock Zod schema validations for Forms
const loginSchema = z.object({
  email: z.string().email('Email không hợp lý'),
  password: z.string().min(8, 'Mật khẩu phải chứa ít nhất 8 ký tự')
});

const quotationFormSchema = z.object({
  customerId: z.string().min(1, 'Chưa chọn khách hàng'),
  items: z.array(z.object({
    modelId: z.string().min(1, 'Chưa chọn thiết bị'),
    quantity: z.number().min(1, 'Số lượng tối thiểu là 1')
  })).min(1, 'Báo giá phải chứa ít nhất 1 thiết bị')
});

// 1. Validate Form Login Schema
export function testLoginFormValidation() {
  const valid = loginSchema.safeParse({ email: 'admin@fireguard.vn', password: 'Password@123' });
  const invalid = loginSchema.safeParse({ email: 'wrong-email', password: '123' });

  if (!valid.success || invalid.success) {
    throw new Error('Test Thất bại: Login form schema validation rules are incorrect.');
  }
  console.log('testLoginFormValidation: PASSED');
}

// 2. Validate Quotation Form Schema
export function testQuotationFormValidation() {
  const valid = quotationFormSchema.safeParse({
    customerId: 'cust_123',
    items: [{ modelId: 'mod_c02', quantity: 5 }]
  });

  const invalid = quotationFormSchema.safeParse({
    customerId: '',
    items: []
  });

  if (!valid.success || invalid.success) {
    throw new Error('Test Thất bại: Quotation form validation rules did not validate constraints.');
  }
  console.log('testQuotationFormValidation: PASSED');
}

// 3. Mock Protected Routes Checks
export function testProtectedRouteRedirect(user: { isAuthenticated: boolean, roles: string[] } | null, allowedRoles: string[]) {
  if (!user || !user.isAuthenticated) {
    return 'REDIRECT_TO_LOGIN';
  }

  const hasPermission = user.roles.some(role => allowedRoles.includes(role));
  if (!hasPermission) {
    return 'REDIRECT_TO_403';
  }

  return 'RENDER_COMPONENT';
}

// 4. Mock SignalR Callback State Event Handlers
export function testSignalREventCallbacks() {
  let isNotified = false;
  let receivedMessage = '';

  const mockHubConnection = {
    on: (eventName: string, callback: (message: string) => void) => {
      if (eventName === 'ReceiveNotification') {
        callback('Báo cáo hoàn tất');
      }
    }
  };

  mockHubConnection.on('ReceiveNotification', (msg) => {
    isNotified = true;
    receivedMessage = msg;
  });

  if (!isNotified || receivedMessage !== 'Báo cáo hoàn tất') {
    throw new Error('Test Thất bại: SignalR event callback state handler failed to process notification event.');
  }
  console.log('testSignalREventCallbacks: PASSED');
}
