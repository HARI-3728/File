document.getElementById("profileForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const value = {
        name: document.getElementById("name").value,
        Id: document.getElementById("Id").value,
        psw: document.getElementById("psw").value
    };
    const message = document.getElementById("profileMessage");
    try {
        const response = await fetch("http://127.0.0.1:3000/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(value)
        });
        const data = await response.json();
        message.innerText = data.message;
        if (response.ok) {
            document.getElementById("profileForm").reset();
        }
    } catch (error) {
        message.innerText = "Something went wrong: " + error.message;
    }
});