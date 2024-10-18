import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, remove, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAXNySP_7C0KC1KYfwHiTB0YJgnsIrKRRI",
    authDomain: "instade-9c8f8.firebaseapp.com",
    databaseURL: "https://instade-9c8f8-default-rtdb.firebaseio.com",
    projectId: "instade-9c8f8",
    storageBucket: "instade-9c8f8.appspot.com",
    messagingSenderId: "65000050367",
    appId: "1:65000050367:web:ff94de62ef3dd03821800a",
    measurementId: "G-T3EL39V7DN"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

let userName = '';
let userCharacter = '';
let replyToMessage = null;

// Authenticate anonymously when the app starts
signInAnonymously(auth).catch((error) => {
  console.error("Error signing in anonymously:", error);
});

// Cek localStorage untuk nama dan karakter
window.onload = function() {
    userName = localStorage.getItem('userName');
    userCharacter = localStorage.getItem('userCharacter');

    if (userName && userCharacter) {
        document.getElementById('setupForm').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        loadMessages();
    }
}

window.selectCharacter = function(character) {
    userCharacter = character;
    document.querySelectorAll('.character-option').forEach(option => {
        option.style.border = 'none';
    });
    event.currentTarget.style.border = '2px solid #128c7e';
}

window.startChat = async function() {
    userName = document.getElementById('nameInput').value.trim();

    if (userName && userCharacter) {
        const usersRef = ref(database, 'users');
        const newUserRef = push(usersRef);

        try {
            await set(newUserRef, { 
                name: userName, 
                character: userCharacter 
            });
            // Simpan nama dan karakter di localStorage
            localStorage.setItem('userName', userName);
            localStorage.setItem('userCharacter', userCharacter);
            
            document.getElementById('setupForm').style.display = 'none';
            document.getElementById('chatContainer').style.display = 'block';
            loadMessages();
        } catch (error) {
            console.error('Error saat menambahkan user:', error);
            alert('Gagal memulai chat. Silakan coba lagi.');
        }
    } else if (!userName) {
        Swal.fire("Masukkan nama untuk memulai chat");
    } else if (!userCharacter) {
        Swal.fire("Pilih karakter untuk memulai chat");
    }
}

window.sendMessage = async function() {
    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    const messageText = messageInput.value.trim();
    const file = fileInput.files[0];

    if (messageText !== '' || file) {
        const messagesRef = ref(database, 'messages');
        const messageData = {
            name: userName,
            text: messageText,
            character: userCharacter,
            timestamp: new Date().toISOString()
        };

        if (replyToMessage) {
            messageData.replyTo = replyToMessage;
            replyToMessage = null;
            document.getElementById('replyMessage').style.display = 'none';
        }

        if (file) {
            const fileRef = storageRef(storage, `uploads/${Date.now()}_${file.name}`);
            try {
                const snapshot = await uploadBytes(fileRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                messageData.fileURL = downloadURL;
                messageData.fileName = file.name;
                console.log('File uploaded, URL:', downloadURL); // Tambahkan ini untuk debugging
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('Gagal mengunggah file. Silakan coba lagi.');
                return;
            }
        }

        push(messagesRef, messageData)
        .then(() => {
            messageInput.value = '';
            clearFileDisplay();
            scrollToBottom();
        })
        .catch((error) => {
            console.error('Error mengirim pesan:', error);
            alert('Gagal mengirim pesan. Silakan coba lagi.');
        });
    }
}
// Di dalam fungsi loadMessages
function loadMessages() {
    const messagesRef = ref(database, 'messages');
    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        console.log('New message received:', message); // Tambahkan ini
        displayMessage(snapshot.key, message);
    });
}

function displayMessage(messageId, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.setAttribute('data-id', messageId);

    const isOwnMessage = message.name === userName;
    messageElement.classList.add(isOwnMessage ? 'message-right' : 'message-left');

    let fileAttachment = '';
    if (message.fileURL) {
        if (message.fileURL.match(/\.(jpeg|jpg|gif|png)$/i) != null) {
            fileAttachment = `
                <div class="file-attachment image-attachment">
                    <img src="${message.fileURL}" alt="${message.fileName}" 
                         style="max-width: 200px; max-height: 200px;"
                         onerror="this.onerror=null; this.src='path/to/fallback-image.png';">
                    <p class="file-name">${message.fileName}</p>
                </div>`;
        } else {
            fileAttachment = `
                <div class="file-attachment">
                    <a href="${message.fileURL}" target="_blank" class="file-link">${message.fileName}</a>
                </div>`;
        }
    }

    let messageContent = `
        <img src="https://api.dicebear.com/6.x/adventurer/svg?seed=${message.character === '1' ? 'Felix' : 'Aneka'}" 
            alt="Avatar" class="avatar">
        <div class="chat-${isOwnMessage ? 'kanan' : 'kiri'}">
            <strong class="nama">${message.name}</strong>
            ${message.replyTo ? `<div class="reply"><strong>Membalas:</strong> ${message.replyTo.text}</div>` : ''}
            <p>${message.text}</p>
            ${fileAttachment}
            <div class="message-info">
                <span class="${isOwnMessage ? 'waktu-kanan' : ''}">${new Date(message.timestamp).toLocaleTimeString()}</span>
                ${isOwnMessage ? `<button class="hapus" onclick="deleteMessage('${messageId}')">Hapus</button>` : 
                                 `<button class="balas-pesan" onclick="replyTo('${messageId}', '${message.name}', '${message.text}')">Balas</button>`}
            </div>
        </div>
    `;

    messageElement.innerHTML = messageContent;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    console.log('Message displayed:', message); // Tambahkan ini untuk debugging
}

window.deleteMessage = function(messageId) {
    const messageRef = ref(database, 'messages/' + messageId);
    remove(messageRef)
        .then(() => {
            const messageElement = document.querySelector(`[data-id='${messageId}']`);
            if (messageElement) {
                messageElement.remove();
            }
            console.log('Pesan berhasil dihapus');
        })
        .catch((error) => console.error('Gagal menghapus pesan:', error));
}

window.replyTo = function(messageId, name, text) {
    replyToMessage = { id: messageId, name: name, text: text };
    const replyText = document.getElementById('replyText');
    replyText.innerHTML = `Membalas pesan dari <strong>${name}</strong>: "${text}"`;
    document.getElementById('replyMessage').style.display = 'flex';
}

window.cancelReply = function() {
    replyToMessage = null;
    document.getElementById('replyMessage').style.display = 'none';
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById('sendButton').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
function clearFileDisplay() {
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const fileInput = document.getElementById('fileInput');
    fileNameDisplay.style.display = 'none';
    fileNameDisplay.textContent = '';
    fileInput.value = '';
    document.getElementById('messageInput').placeholder = "Ketik pesan...";
}
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                fileNameDisplay.innerHTML = `
                    <img src="${e.target.result}" style="max-width: 200px; max-height: 200px;">
                    <p>File dipilih: ${file.name}</p>
                `;
            }
            reader.readAsDataURL(file);
        } else {
            fileNameDisplay.textContent = `File dipilih: ${file.name}`;
        }
        fileNameDisplay.style.display = 'block';
        document.getElementById('messageInput').placeholder = "Ketik pesan...";
    } else {
        clearFileDisplay();
    }
});

// Inisialisasi saat halaman dimuat
window.onload = function() {
    userName = localStorage.getItem('userName');
    userCharacter = localStorage.getItem('userCharacter');

    if (userName && userCharacter) {
        document.getElementById('setupForm').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        loadMessages();
    }

    // Authenticate anonymously
    signInAnonymously(auth).catch((error) => {
        console.error("Error signing in anonymously:", error);
    });
}

