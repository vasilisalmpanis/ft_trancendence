document.addEventListener('DOMContentLoaded', function () {
    const signUpForm = document.querySelector('.signUpForm');

    signUpForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Get the values from the form fields
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
		const email = document.getElementById('email').value.trim();

        // Validate inputs
        if (username === '' || password === '' || password === '') {
            // Show error message if any field is empty
            showError('Please fill in all fields');
            return;
        }

        // If inputs are valid, send data to backend
        sendData(username, password, email);
    });

    function showError(message) {
        const errorMessageElements = document.querySelectorAll('.error-message');
        errorMessageElements.forEach(function (element) {
            element.textContent = message;
        });
    }

    function sendData(username, password, email) {
        // Create a JSON object with the data
        const data = {
            username: username,
            password: password,
			email: email,
        };

        // Send a POST request to the backend
        fetch('/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                // Redirect to dashboard if login is successful
                window.location.href = 'dashboard';
            } else {
                // Handle errors if login fails
                showError('user/password combination not found');
				window.location.href = 'unknown_user';
            }
        })
        .catch(error => {
            // Handle network errors
            console.error('Error:', error);
            showError('An error occurred. Please try again later.');
        });
    }
});