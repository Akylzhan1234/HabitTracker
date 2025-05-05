const tabs = document.querySelectorAll('.tab-button');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const target = tab.getAttribute('data-form');

    if (target === 'login-form') {
      // Login active, slide it to center
      loginForm.classList.add('slide-center');
      loginForm.classList.remove('slide-left', 'slide-right');
      loginForm.classList.add('active');

      signupForm.classList.remove('slide-center', 'slide-left');
      signupForm.classList.add('slide-right');
      signupForm.classList.remove('active');
    } else {
      // Sign up active, slide it to center
      signupForm.classList.add('slide-center');
      signupForm.classList.remove('slide-left', 'slide-right');
      signupForm.classList.add('active');

      loginForm.classList.remove('slide-center', 'slide-right');
      loginForm.classList.add('slide-left');
      loginForm.classList.remove('active');
    }
  });
});