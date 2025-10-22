const form = document.getElementById('loginForm');
const userId = document.getElementById('userId');
const password = document.getElementById('password');
const formError = document.getElementById('formError');
const pwdError = document.getElementById('passwordError');
const togglePwd = document.getElementById('togglePwd');

const recoverBtn = document.getElementById('recoverBtn');
const recoverModal = document.getElementById('recoverModal');
const cancelRecover = document.getElementById('cancelRecover');
const sendRecover = document.getElementById('sendRecover');
const recoverInput = document.getElementById('recoverInput');
const recoverError = document.getElementById('recoverError');

// Show/hide password
togglePwd.addEventListener('click', () => {
  const isPwd = password.type === 'password';
  password.type = isPwd ? 'text' : 'password';
  togglePwd.textContent = isPwd ? '🙈' : '👁️';
});

// Form validation
form.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.textContent = '';
  pwdError.textContent = '';

  const uid = userId.value.trim();
  const pwd = password.value;

  if(!uid){
    formError.textContent = 'Please enter your user ID.';
    return;
  }
  if(!pwd || pwd.length < 6){
    pwdError.textContent = 'Password must be at least 6 characters.';
    return;
  }

  // Success simulation
  formError.style.color = '#22c55e';
  formError.textContent = 'Authentication successful (demo). Redirecting…';
  setTimeout(()=> window.location.href = '../HTML/dashboard.html', 800);
});

// Recovery modal
const openModal = () => { recoverModal.style.display = 'flex'; recoverInput.value=''; };
const closeModal = () => { recoverModal.style.display = 'none'; };

recoverBtn.addEventListener('click', openModal);
cancelRecover.addEventListener('click', closeModal);
recoverModal.addEventListener('click', (e)=>{ if(e.target === recoverModal) closeModal(); });

sendRecover.addEventListener('click', () => {
  const value = recoverInput.value.trim();
  recoverError.textContent = '';
  if(!value){
    recoverError.textContent = 'Please enter a valid ID or email.';
    return;
  }
  closeModal();
  alert('If the ID/email exists, we will send you a password reset link.');
});