### bmNotify

This is a small nodejs script which connects to the Brandmeister API and will announce on IRC when a transmission is heard on a specific talk group.

Edit `index.js` to define your preferred talkgroups and irc details.

Install & run:
```
npm install
node index.js
```

Run under a process manager like `pm2` to make sure it stays running.
