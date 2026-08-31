document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");
    try {
        const response = await fetch("https://file-4-vza4.onrender.com/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ username, password })
        });
        // https://file-4-vza4.onrender.com/
        const data = await response.json();
        message.innerText = data.message;
        if (response.ok) {
            window.location.href = "profile.html";
        }
    } catch (error) {
        message.innerText = error.message;
    }
});