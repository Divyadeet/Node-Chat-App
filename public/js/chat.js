const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const $messageTemplate = document.querySelector('#message-template').innerHTML;
const $locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild;

    //Height of the new messages
    const newMessagesStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessagesStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //Visible height
    const visibleHeight = $messages.offsetHeight;

    //Height of message container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    // console.log(message);
    const html = Mustache.render($messageTemplate,{
        username:message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('locationMessage', (url) => {
    //console.log(usern);
    const html = Mustache.render($locationMessageTemplate,{
        username : url.username,
        url : url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    });
    
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData',({room, users}) => {
   const html = Mustache.render($sidebarTemplate, {
       room,
       users
   });
   
   //$sidebar.insertAdjacentHTML('beforeend', html); sidebar is getting repeated with this
   document.querySelector('#sidebar').innerHTML = html;
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');

    const msg = e.target.elements.message.value;    //document.querySelector('input').value;
    socket.emit('sendMsg', msg, (error) => {

        $messageFormButton.removeAttribute('disabled', 'disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error){
            return console.log(error);
        }
        console.log('Message delivered !!');
    });
})

document.querySelector('#send-location').addEventListener('click', () => {

    $sendLocationButton.setAttribute('disabled', 'disabled');

    if(!navigator.geolocation){
        console.log('Browser doesnot support location feature');
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            latitude : position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            $sendLocationButton.removeAttribute('disabled');
            if(error){
                return console.log(error);
            }
            console.log(position.coords.longitude, position.coords.latitude);
        });
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error);
        location.href = '/'; // redirect to home page
    }
})

// socket.on('CountUpdated', (count) => {
//     console.log('Count Updated', count);
// })

// document.querySelector('#increment').addEventListener('click' , () => {
//     socket.emit('increment');
// })