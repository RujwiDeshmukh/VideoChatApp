let Peer = require("simple-peer");

let socket = io();

const video = document.querySelector("video"); //we want refrence to our own video

const filter = document.querySelector("#filter");

const checkboxTheme = document.querySelector("#theme");

let client = {}; //it contain data related to other person

let currentFilter; //u have already set  a filter n there is not client so our filter ll be in current filter value

//get video stream = we ll hve to ask browser for users permission
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  //if users gave the permission
  .then((stream) => {
    //after having stream we need to notify backend user has given permission please add 1 client
    socket.emit("NewClient");
    //display a video
    video.srcObject = stream;
    video.play(); //now user can see himself

    filter.addEventListener("change", (event) => {
      currentFilter = event.target.value; //asit is css value
      video.style.filter = currentFilter;
      SendFilter(currentFilter);
      event.preventDefault;
    });

    //define new peer  type can be true or false or used to initialize a peer
    InitPeer = (type) => {
      //if init is true it ll send offer/request itself
      //if init is false it ll not send offer  ll wait for offer n then answer
      let peer = new Peer({
        initiator: type == "init" ? true : false,
        stream: stream,
        trickle: false,
      });
      peer.on("stream", (stream) => CreateVideo(stream)); //after getting stream from other users we want to create new video

      //This isnt working on chrome thus we defined RemovePeer fuct
      /* peer.on("close", () => {
        document.getElementById("peerVideo").remove(); //when peer is closed u want to destroy the video
        peer.destroy();
      });*/

      //as we created a peer want to know when any data comes i.e. filter values
      peer.on("data", (data) => {
        //receive fuctn for filter
        let decodedData = new TextDecoder("utf-8").decode(data); //we want to convert data as data is in array format we want to decode it to utf-8
        let peervideo = document.querySelector("#peerVideo"); //peerVideo is dynamically generated no need of refrence
        peervideo.style.filter = decodedData;
      });
      return peer;
    };

    //for removing peer from chat
    RemovePeer = () => {
      document.getElementById("peerVideo").remove();
      document.getElementById("muteText").remove();
      if (client.peer) {
        client.peer.destroy();
      }
    };

    //Creating new peer of init
    MakePeer = () => {
      client.gotAnswer = false; //after sending offer/request ll wait for answer/response till then it is false
      let peer = InitPeer("init");
      peer.on("signal", (data) => {
        //as peer is of type init it ll automatically run this signal func n send request
        if (!client.gotAnswer) {
          socket.emit("Offer", data);
        }
      });

      client.peer = peer;
    };

    //It is used when we get offer from client  we want to send him answer
    //for peer of type not init
    FrontAnswer = (offer) => {
      let peer = InitPeer("notInit");
      peer.on("signal", (data) => {
        //here signal is notrun automatically as peer is not of type init
        socket.emit("Answer", data); //we got signal means we got offer/request
      });

      peer.signal(offer); //we need to call func signal it ll generate an answer  n send it to backend
      //so that it can send it to other user
      client.peer = peer; //created a peer n added to a client object
    };

    //fuctn ll handle when ans comes from backend
    SignalAnswer = (answer) => {
      client.gotAnswer = true;
      let peer = client.peer; //after that both the clients are connected
      peer.signal(answer);
    };

    //it ll start video
    CreateVideo = (stream) => {
      CreateDiv();

      let video = document.createElement("video");
      video.id = "peerVideo";
      video.srcObject = stream; //setting source to stream
      /* video.class = "embed-responsive-item";*/
      video.setAttribute("class", "embed-responsive-item");
      document.querySelector("#peerDiv").appendChild(video);
      video.play();
      // SendFilter(currentFilter); //when there is another person present n if the filter is already set u need to send it
      setTimeout(() => SendFilter(currentFilter), 500); //our web rtc channelwas not ready so have to wait for half sec

      video.addEventListener("click", () => {
        if (video.volume != 0) {
          video.volume = 0;
        } else {
          video.volume = 1;
        }
      });
    };

    //fuctn ll be called when already ppl chatting n someone-else open URL n he should be notified that
    //session going on, it is active
    SessionActive = () => {
      document.write("Session Active. Please come back later.");
    };

    //Sending Filter to other person
    SendFilter = (filter) => {
      if (client.peer)
        //if there is another functn then only we have to send it
        client.peer.send(filter); //peer has inbuilt send
    };

    //here is the event for which all the functions ll run
    socket.on("BackOffer", FrontAnswer); //as offer ll come from back we want to generate front ans
    socket.on("BackAnswer", SignalAnswer); //if answer is coming from backend u want to handle that n connect both the clients
    socket.on("SessionActive", SessionActive);
    socket.on("CreatePeer", MakePeer);
    socket.on("Disconnect", RemovePeer);
  })
  //if users doesnt give us a permission
  .catch((err) => document.write(err));

//Refrence to checkboxtheme it is like toggle fuctn
checkboxTheme.addEventListener("click", () => {
  if (checkboxTheme.checked == true) {
    document.body.style.backgroundColor = "#212529";
    if (document.querySelector("#muteText")) {
      document.querySelector("#muteText").style.color = "#fff";
    }
  } else {
    document.body.style.backgroundColor = "#fff";
    if (document.querySelector("#muteText")) {
      document.querySelector("#muteText").style.color = "#212529";
    }
  }
});

CreateDiv = () => {
  let div = document.createElement("div");
  div.setAttribute("class", "centered");
  div.id = "muteText";
  div.innerHTML = "Click to Mute/Unmute";
  document.querySelector("#peerDiv").appendChild(div);
  if (checkboxTheme.checked == true) {
    document.querySelector("#muteText").style.color = "#fff";
  }
};
