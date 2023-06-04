import { loginUser } from "./controllers/loginController.js";
import { registerUser } from "./controllers/signupController.js";
import { logoutUser } from "./controllers/logoutController.js";


function registerRoutes(router) {
    router.get('/', (req, res) => {
        res.write('Hello world');
        res.statusCode = 200;
        res.end();
    });

    router.post('/', (req, res) => {
        console.log(req.body);
        res.end();
    });

    router.post('/login', loginUser);
    router.post('/register', registerUser);
    router.post('/logout', logoutUser);
}

export { registerRoutes };
