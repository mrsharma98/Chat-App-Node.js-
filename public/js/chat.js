const socket = io();
// to connect to the server

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-message-template")
  .innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
// location is a environment variable
// that will give us query string
// ignoreQueryPrefix -  this will ignore ? in the start

// auto scrolling
const autoscroll = () => {
  // Grabbing the new message
  const $newMessage = $messages.lastElementChild;

  // Heigth of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  // the above two statement will give the margin values

  const newMessageHeigth = $newMessage.offsetHeigth + newMessageMargin;
  // we are adding margin value and new message value to get the total heigth

  // Visible heigth
  const visibleheight = $messages.offsetHeigth;

  // Height og messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scroolled?
  const scrollOffset = $messages.scrollTop + visibleheight;
  // gets how far we are from top

  if (containerHeight - newMessageHeigth <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("hh:mm a"),
  });
  // this is the final html that is to be rendered

  $messages.insertAdjacentHTML("beforeend", html);
  // for inserting html to the div
  autoscroll();
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("hh:mm a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);

  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  // console.log(room);
  // console.log(users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";

    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("Message delivered!");
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported bt your browser.");
  }

  $sendLocationButton.setAttribute("disabled", "disbaled");

  navigator.geolocation.getCurrentPosition((position, e) => {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;

    socket.emit("sendLocation", { latitude, longitude }, () => {
      console.log("Location shared!");
      $sendLocationButton.removeAttribute("disabled");
      $messageFormInput.focus();
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
