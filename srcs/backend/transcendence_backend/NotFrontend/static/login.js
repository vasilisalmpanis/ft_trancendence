function removeAllChildNodes(parent) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}

// Define the loginPage function
function createLoginForm() {
    const app = document.getElementById('app');

    // Create the login form elements
    const loginForm = document.createElement('form');
    loginForm.classList.add('login-form');

    const usernameInput = document.createElement('input');
    usernameInput.setAttribute('type', 'text');
    usernameInput.setAttribute('placeholder', 'Username');
    usernameInput.setAttribute('name', 'username');
    usernameInput.classList.add('username-input');

    const passwordInput = document.createElement('input');
    passwordInput.setAttribute('type', 'password');
    passwordInput.setAttribute('placeholder', 'Password');
    passwordInput.setAttribute('name', 'password');
    passwordInput.classList.add('password-input');

    const loginButton = document.createElement('button');
    loginButton.textContent = 'Login';
    loginButton.setAttribute('type', 'submit');
    loginButton.classList.add('login-button');

    // Append input fields and login button to the form
    loginForm.appendChild(usernameInput);
    loginForm.appendChild(passwordInput);
    loginForm.appendChild(loginButton);

    // Append the login form to the app container
    app.appendChild(loginForm);

    // Add event listener for form submission
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }
		sendData(username, password);
	});
};

function handleLoginOutcome(outcome) {
    removeAllChildNodes(app);

    const message = document.createElement('p');

	if (outcome) {
		message.textContent = 'Login successful!'
		app.appendChild(message);
	}
	else {
		message.textContent ='Login failed. Please try again or sign up.';
		app.appendChild(message);
	}
}

function sendData(username, password) {
	//JSON object with the data
	const data = {
		username: username,
		password: password
	};
	// Send a POST request to the backend
	fetch('/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	})
	.then(response => {
		if (response.ok) {
			// Redirect to dashboard if login is successful
		    handleLoginOutcome(true);
		} else {
			handleLoginOutcome(false);
		}
	})
	.catch(error => {
		// Handle network errors
		console.error('Error:', error);
		alert('An error occurred. Please try again later.');
	});
}

// Call the loginPage function within the DOMContentLoaded event listener callback
document.addEventListener('DOMContentLoaded', createLoginForm);