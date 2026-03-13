const AuthMiddleware = require('../middleware/authMiddleware');
const lib = require('../middleware/tokenLib');

jest.mock('../middleware/tokenLib', () => ({
  validateToken: jest.fn()
}));

describe('AuthMiddleware.validateToken', () => {
  let mockReq;
  let mockRes;
  let next;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should bypass JWT validation if x-user-id header is present from VPC', async () => {
    mockReq.headers['x-user-id'] = '123';
    mockReq.headers['x-forwarded-for'] = '10.0.1.5'; // ALB appends VPC source IP last
    await AuthMiddleware.validateToken(mockReq, mockRes, next);
    
    expect(mockReq.requestContext.authorizer).toEqual({ id: '123' });
    expect(next).toHaveBeenCalled();
    expect(lib.validateToken).not.toHaveBeenCalled();
  });

  test('should block x-user-id header from external (non-VPC) IP', async () => {
    mockReq.headers['x-user-id'] = '123';
    mockReq.headers['x-forwarded-for'] = '203.0.113.1'; // External IP
    await AuthMiddleware.validateToken(mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.send).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if no token is provided', async () => {
    await AuthMiddleware.validateToken(mockReq, mockRes, next);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.send).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if invalid token is provided', async () => {
    mockReq.headers.authorization = 'Bearer invalid-token';
    lib.validateToken.mockResolvedValue(null);
    
    await AuthMiddleware.validateToken(mockReq, mockRes, next);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.send).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next and set authorizer for valid token', async () => {
    mockReq.headers.authorization = 'Bearer valid-token';
    const decoded = { userdata: { id: '456' } };
    lib.validateToken.mockResolvedValue(decoded);
    
    await AuthMiddleware.validateToken(mockReq, mockRes, next);
    
    expect(mockReq.requestContext.authorizer).toEqual({ id: '456' });
    expect(next).toHaveBeenCalled();
  });

  test('should return 403 on error', async () => {
    mockReq.headers.authorization = 'Bearer error-token';
    lib.validateToken.mockRejectedValue(new Error('JWT expired'));
    
    await AuthMiddleware.validateToken(mockReq, mockRes, next);
    
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'JWT expired' });
    expect(next).not.toHaveBeenCalled();
  });
});
