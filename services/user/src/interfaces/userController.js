// Interface Layer: userController (ES Modules)
import { UserService } from '../application/UserService.js';

const userService = new UserService();

export const validate = async (req, res) => {
  const { username, password } = req.body;
  const result = await userService.validateUser(username, password);
  res.json(result);
};