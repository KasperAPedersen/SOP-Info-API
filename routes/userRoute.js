import Express, { Router } from 'express';
const router = Router();

class User {
    constructor(id, fname, lname, uname, pword, consent) {
        this.id = id;
        this.firstName = fname;
        this.lastName = lname;
        this.username = uname;
        this.password = pword;
        this.consent = consent;
    }
}

const users = [
    new User(1, "Johnny", "Doe", "user1", "pass1", false),
    new User(2, "Jane", "Smith", "user2", "pass2", false)
];

router.post('/authenticate', Express.json(), (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

router.get('/:id/get', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

router.get('/:id/get/username', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    if (user) {
        res.type('text/plain').send(user.username);
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

router.get('/:id/get/name', (req, res) => {
   const id = parseInt(req.params.id);
   const user = users.find(u => u.id === id);
   if (user) {
       res.type('text/plain').send(user.firstName + " " + user.lastName);
   } else {
       res.status(404).json({ error: "User not found" });
   }
});

router.get('/:id/get/consent', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    if (user) {
        res.json({ consent: user.consent });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

router.post('/:id/set/consent', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    if (user) {
        user.consent = req.body.consent;
        // return true if consent is set successfully
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

router.post('/:id/set/password', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    if(user) {
        user.password = req.body.password;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

export default router;