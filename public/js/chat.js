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

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
// location is a environment variable
// that will give us query string
// ignoreQueryPrefix -  this will ignore ? in the start

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format("hh:mm a"),
  });
  // this is the final html that is to be rendered

  $messages.insertAdjacentHTML("beforeend", html);
  // for inserting html to the div
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationTemplate, {
    url: message.url,
    createdAt: moment(message.createdAt).format("hh:mm a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);
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
