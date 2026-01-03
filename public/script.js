// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDl1NfXjShEbrvkwafbW8bGJyAp89ceVR8",
  authDomain: "qrcode-generator-16535.firebaseapp.com",
  projectId: "qrcode-generator-16535",
  storageBucket: "qrcode-generator-16535.firebasestorage.app",
  messagingSenderId: "448969259756",
  appId: "1:448969259756:web:a11fc0aafbcaebca0683c9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

let currentUser = null;
let selectedCodes = [];
let codesFetchToken = 0;
let errorHideTimeout;

// Auth state observer
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateUI();
  if (user) {
    displaySavedQRCodes();
  }
});

// Google login
window.loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    showError('Logged in successfully!', 'success');
    updateUI();
    displaySavedQRCodes();
  } catch (error) {
    showError('Login failed: ' + error.message);
  }
};

// Logout
window.logout = async () => {
  try {
    await signOut(auth);
    currentUser = null;
    updateUI();
    document.getElementById('qrCodeList').innerHTML = '';
    showError('Logged out successfully!', 'success');
  } catch (error) {
    showError('Logout failed: ' + error.message);
  }
};

// Update UI based on auth state
function updateUI() {
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const userInfo = document.getElementById('userInfo');

  if (currentUser) {
    loginButton.style.display = 'none';
    logoutButton.style.display = 'block';
    userInfo.style.display = 'inline';
    userInfo.textContent = `Hello, ${currentUser.displayName || currentUser.email}`;
  } else {
    loginButton.style.display = 'block';
    logoutButton.style.display = 'none';
    userInfo.style.display = 'none';
  }
}

// Generate QR Code
window.generateQRCode = async () => {
  let link = document.getElementById('link').value;

  if (!link) {
    showError('Please enter a link');
    return;
  }

  // Add http:// if missing
  if (!/^https?:\/\//i.test(link)) {
    link = 'http://' + link;
  }

  // Generate title from URL
  let title = '';
  try {
    const urlParts = new URL(link);
    title = urlParts.hostname;
  } catch (error) {
    title = 'QR Code';
  }


  const qrcodeElement = document.getElementById('qrcode');
  // Clear and hide before generating
  qrcodeElement.innerHTML = '';
  qrcodeElement.style.display = 'none';

  // Generate QR code
  const qr = qrcode(0, 'L');
  qr.addData(link);
  qr.make();

  const qrImageTag = qr.createImgTag();
  qrcodeElement.innerHTML = qrImageTag;
  qrcodeElement.style.display = 'inline-block';

  const imgElement = qrcodeElement.querySelector('img');
  const qrImageData = imgElement ? imgElement.src : '';

  // Save to Firestore only if user is logged in
  if (currentUser) {
    await saveQRCode(link, title, qrImageData);
  } else {
    showError('QR code generated! Log in to save it.', 'success');
  }
};

// Save QR code to Firestore
async function saveQRCode(link, title, qrImageData) {
  try {
    const docRef = await addDoc(collection(db, 'qrcodes'), {
      userId: currentUser.uid,
      link: link,
      title: title,
      qr_image: qrImageData,
      createdAt: serverTimestamp()
    });
    console.log('QR code saved with ID:', docRef.id);
    showError('QR code saved!', 'success');
    displaySavedQRCodes();
  } catch (error) {
    console.error('Error saving QR code:', error);
    showError('Error saving QR code: ' + error.message);
  }
}

// Display saved QR codes
async function displaySavedQRCodes() {
  const qrCodeList = document.getElementById('qrCodeList');
  const currentRunToken = ++codesFetchToken;
  qrCodeList.innerHTML = '';

  if (!currentUser) {
    selectedCodes = [];
    const qrActions = document.querySelector('.qr-actions');
    if (qrActions) {
      qrActions.style.display = 'none';
    }
    return;
  }

  try {
    const q = query(collection(db, 'qrcodes'), where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (currentRunToken !== codesFetchToken) {
      return;
    }

    querySnapshot.forEach((docSnapshot) => {
      const code = docSnapshot.data();
      const qrCodeItem = document.createElement('div');
      qrCodeItem.className = 'qr-code-item';
      qrCodeItem.id = `qrCode-${docSnapshot.id}`;
      qrCodeItem.innerHTML = `
        <img src="${code.qr_image}" alt="QR Code">
        <p>${code.title || 'No title'}</p>
      `;

      qrCodeItem.addEventListener('click', () => toggleQRCodeSelection(docSnapshot.id));
      qrCodeList.appendChild(qrCodeItem);
    });
  } catch (error) {
    console.error('Error loading QR codes:', error);
    showError('Error loading QR codes: ' + error.message);
  }
}

// Toggle QR code selection
function toggleQRCodeSelection(id) {
  const qrCodeItem = document.getElementById(`qrCode-${id}`);
  const qrActions = document.querySelector('.qr-actions');

  if (selectedCodes.includes(id)) {
    selectedCodes = selectedCodes.filter(code => code !== id);
    qrCodeItem.classList.remove('selected');
  } else {
    selectedCodes.push(id);
    qrCodeItem.classList.add('selected');
  }

  qrActions.style.display = selectedCodes.length > 0 ? 'block' : 'none';
}

// Delete selected QR codes
window.deleteSelected = async () => {
  if (selectedCodes.length === 0) {
    showError('No QR codes selected');
    return;
  }

  if (!confirm(`Delete ${selectedCodes.length} QR code(s)?`)) {
    return;
  }

  try {
    for (const id of selectedCodes) {
      await deleteDoc(doc(db, 'qrcodes', id));
      const qrCodeItem = document.getElementById(`qrCode-${id}`);
      if (qrCodeItem) {
        qrCodeItem.remove();
      }
    }
    selectedCodes = [];
    document.querySelector('.qr-actions').style.display = 'none';
    showError('QR codes deleted!', 'success');
  } catch (error) {
    console.error('Error deleting QR codes:', error);
    showError('Error deleting QR codes: ' + error.message);
  }
};

// Show error/success message
function showError(message, type = 'error') {
  const errorBox = document.getElementById('errorBox');
  if (!errorBox) {
    return;
  }

  errorBox.textContent = message;
  errorBox.style.display = 'block';
  errorBox.classList.remove('notification-success', 'notification-error');
  errorBox.classList.add(type === 'success' ? 'notification-success' : 'notification-error');

  if (errorHideTimeout) {
    clearTimeout(errorHideTimeout);
  }

  errorHideTimeout = setTimeout(() => {
    errorBox.style.display = 'none';
  }, 5000);
}


// Hide QR code box on load
window.addEventListener('DOMContentLoaded', () => {
  const qrcodeElement = document.getElementById('qrcode');
  if (qrcodeElement) {
    qrcodeElement.innerHTML = '';
    qrcodeElement.style.display = 'none';
  }
  updateUI();
});
