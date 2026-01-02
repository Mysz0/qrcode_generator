let token = null;
let selectedCodes = [];

function showRegister() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const qrGenerator = document.querySelector('.container'); 
    
    if (registerForm.style.display === 'none' || registerForm.style.display === '') {
        
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        qrGenerator.style.display = 'none'; 
    } else {
        
        registerForm.style.display = 'none';
        qrGenerator.style.display = 'block'; 
    }
    
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('errorBox').style.display = 'none';
}

function showLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const qrGenerator = document.querySelector('.container'); 
    
    if (loginForm.style.display === 'none' || loginForm.style.display === '') {
        
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        qrGenerator.style.display = 'none'; 
    } else {
        
        loginForm.style.display = 'none';
        qrGenerator.style.display = 'block'; 
    }

    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('errorBox').style.display = 'none';
}

function showForgotPassword() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block'; 
    document.getElementById('errorBox').style.display = 'none'; 
}

function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Registration complete. Check your email to activate your account.');
            showLogin(); 
        } else {
            showError('Wystąpił problem: ' + data.message);
        }
    })
    .catch(error => {
        showError('Błąd przy rejestracji: ' + error.message);
    });
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errorData => {
                if (errorData.message === 'Account not activated') {
                    showError('Your account has not been activated yet. Please check your e-mail.');
                } else {
                    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
                }
            });
        }
        return res.json();
    })
    .then(data => {
        token = data.token;
        if (rememberMe) {
            localStorage.setItem('authToken', token); 
            sessionStorage.removeItem('authToken'); 
        } else {
            sessionStorage.setItem('authToken', token); 
            localStorage.removeItem('authToken'); 
        }
        updateUI();

        
        const qrGenerator = document.querySelector('.container'); 
        qrGenerator.style.display = 'block'; 

        document.getElementById('loginForm').style.display = 'none';
    })
    .catch(error => {
        showError('Log in error: ' + error.message);
    });
}

function forgotPassword() {
    const email = document.getElementById('forgotPasswordEmail').value;

    if (!email) {
        alert('Please provide an e-mail address.');
        return;
    }

    fetch('/api/users/forgotPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Password reset link has been sent');
        } else {
            alert('Error occured: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error occured while sending password reset link');
    });
}

function generateQRCode() {
    let link = document.getElementById('link').value;
    let title = ''; 

    if (!link) {
        return;
    }

  
    if (!/^https?:\/\//i.test(link)) {
        link = 'http://' + link;
    }

    
    try {
        const urlParts = new URL(link);
        title = urlParts.hostname; 
    } catch (error) {
        title = 'QR Code'; 
    }
    
    const qrcodeElement = document.getElementById('qrcode');
    
    const qr = qrcode(0, 'L');
    qr.addData(link);
    qr.make();
    
    const qrImageTag = qr.createImgTag();
    qrcodeElement.innerHTML = qrImageTag;

   
    const imgElement = qrcodeElement.querySelector('img');
    const qrImageData = imgElement ? imgElement.src : '';

    
    saveQRCode(link, title, qrImageData);
}

function saveQRCode(link, title, qrImageData) {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    fetch('/api/qr-codes/save_qr', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ link, title, qrImageData })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errorData => {
                throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
            });
        }
        return res.json();
    })
    .then(data => {
        console.log('Qr code saved:', data);
        displaySavedQRCodes(); 
    })
    .catch(error => {
        console.error('Error saving qr code:', error);
    });
}

function logout() {
    token = null;
    localStorage.removeItem('authToken'); 
    sessionStorage.removeItem('authToken'); 
    updateUI(); 
}

function updateUI() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const isLoggedIn = token !== null;

    document.getElementById('showRegisterButton').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('showLoginButton').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('logoutButton').style.display = isLoggedIn ? 'block' : 'none';

    if (isLoggedIn) {
        displaySavedQRCodes(); 
    } else {
        document.getElementById('qrCodeList').innerHTML = ''; 
    }
}

function deleteQRCode(id) {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    fetch(`/api/qr-codes/delete/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) {
            if (res.status === 401) {
                alert('Token expired. Please log in again.');
                window.location.href = '/login'; 
            } else {
                return res.json().then(errorData => {
                    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
                });
            }
        }
        return res.json();
    })
    .then(data => {
        console.log('Qr code has been deleted:', data);
        
        
        const qrCodeItem = document.getElementById(`qrCode-${id}`);
        if (qrCodeItem) {
            qrCodeItem.remove();
        }

        
        
    })
    .catch(error => {
        console.error('Error while deleting qr code:', error);
    });
}

function displaySavedQRCodes() {
    const qrCodeList = document.getElementById('qrCodeList');
    qrCodeList.innerHTML = ''; 

    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
        showError('Token not found. Please log in.');
        return;
    }

    fetch('/api/qr-codes/list', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(codes => {
        codes.forEach(code => {
            const qrCodeItem = document.createElement('div');
            qrCodeItem.className = 'qr-code-item';
            qrCodeItem.id = `qrCode-${code.id}`; 
            qrCodeItem.innerHTML = `
                <img src="${code.qr_image}" alt="QR Code">
                <p>${code.title || 'No title'}</p>
            `;

           
            qrCodeItem.addEventListener('click', () => toggleQRCodeSelection(code.id));

            qrCodeList.appendChild(qrCodeItem);
        });
    })
    .catch(error => {
        console.error('Error fetching qr codes:', error);
    });
}

function toggleQRCodeSelection(id) {
    const qrCodeItem = document.getElementById(`qrCode-${id}`);
    
    
    if (selectedCodes.includes(id)) {
        selectedCodes = selectedCodes.filter(codeId => codeId !== id);
        qrCodeItem.classList.remove('selected');
    } else {
        selectedCodes.push(id);
        qrCodeItem.classList.add('selected');
    }


    const qrActions = document.querySelector('.qr-actions');
    if (selectedCodes.length > 0) {
        qrActions.style.display = 'block';
    } else {
        qrActions.style.display = 'none';
    }
}

function deleteSelected() {
    selectedCodes.forEach(id => {
        deleteQRCode(id);
    });
    selectedCodes = []; 
    document.querySelector('.qr-actions').style.display = 'none'; 
}

function requestPasswordReset() {
    const email = document.getElementById('forgotPasswordEmail').value;

    if (!email) {
        showError('Please provide an e-mail address.');
        return;
    }

    fetch('/api/users/forgotPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Link has been sent. Please check your e-mail and spam inbox.');
            showLogin(); 
        } else {
            showError('An error occured: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('There was an error while sending password reset link.');
    });
}

function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (newPassword !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    fetch(`/api/users/resetPassword/${token}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            password: newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Password has been succesfully changed.');
            window.location.href = '/'; 
        } else {
            document.getElementById('errorBox').style.display = 'block';
            document.getElementById('errorBox').innerText = data.message;
        }
    })
    .catch(error => {
        document.getElementById('errorBox').style.display = 'block';
        document.getElementById('errorBox').innerText = 'There was an error with changing the password.';
    });
}


function checkForResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('changePasswordForm').style.display = 'block';
    }
}

function showError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.innerText = message;
    errorBox.style.display = 'block';
    errorBox.style.opacity = '1'; 
    errorBox.style.transition = 'opacity 1s ease'; 

    
    setTimeout(() => {
        errorBox.style.opacity = '0'; 
      
        setTimeout(() => {
            errorBox.style.display = 'none';
        }, 1000);
    }, 3000); 
}



window.onload = updateUI;
