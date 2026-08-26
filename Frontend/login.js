document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");
    try {
        const response = await fetch("http://127.0.0.1:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        message.innerText = data.message;
        if (response.ok) {
            window.location.href = "profile.html";
        }
    } catch (error) {
        message.innerText = error.message;
    }
});