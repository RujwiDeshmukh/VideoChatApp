const express = require("express");
const app = express();

//we need http server
const http = require("http").Server(app); //we want to supply our app to server

//Creating an instance of socket.io by passing http to it

const io = require("socket.io")(http);

//Create a port
const port = process.env.PORT || 3000; //port available or port 5500

//Middleware
//we want our static files to load
app.use(express.static(__dirname + "/public"));

let clients = 0;

//For creating connection
io.on("connection", (socket) => {
  socket.on("NewClient", () => {
    //this ll run as connection betn front-end n back-end is made
    //NewClient is the event to be handled
    if (clients < 2) {
      if (clients == 1) {
        this.emit("CreatePeer"); //if it is true we want this particular socket to go back n run create peer fuctn
      }
    } else {
      this.emit("SessionActive");
      clients++;
      console.log("clients:", clients);
    }
  });

  socket.on("Offer", SendOffer); //if offer is coming from front-end send-offer ll handle that
  socket.on("Answer", SendAnswer); //if answer is coming from front-end send ans to other user
  socket.on("disconnect", Disconnect); //builtin event if we close browser window,functn ll run n decrease clients
});

Disconnect = () => {
  if (clients > 0) {
    if (clients <= 2) this.broadcast("Disconnect");
    clients--;
  }
};

SendOffer = (offer) => {
  //we want to send offer to other user so it shouldnt be sent to us bt it should send to other user
  this.broadcast.emit("BackOffer", offer);
};

SendAnswer = (answer) => {
  this.broadcast.emit("BackAnswer", answer); //it ll send answer to other user
};

http.listen(port, () => console.log(`Active on ${port} port`));
