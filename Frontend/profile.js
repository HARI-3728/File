async function loadProfile() {
    const response = await fetch("http://127.0.0.1:3000/profile", {
        method: "GET",
        credentials: "include"
    });
    if (!response.ok) {
        window.location.href = "login.html";
        return;
    }
    const student = await response.json();
    document.getElementById("name").value = student.name;
    document.getElementById("Id").value = student.Id;

}
loadProfile();

document.getElementById("profileForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    let pass=document.getElementById("psw").value;
    const value = {
        name: document.getElementById("name").value,
        Id: document.getElementById("Id").value
    };
    if(pass.trim()!==""){
        value.psw=pass
    }
    const message = document.getElementById("profileMessage");
    if(event.submitter.value=="update"){
        try {
        const response = await fetch("http://127.0.0.1:3000/profile", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(value)
        });
        const data = await response.json();
        message.innerText = data.message;
        if (response.ok) {
            message.innerText = "Profile updated successfully";
        }
        } catch (error) {
            message.innerText = "Something went wrong: " + error.message;
        }
    }
    if(event.submitter.value=="delete"){
        if(confirm("Are You Deleting this Profile")){
            try{
              const response = await fetch("http://127.0.0.1:3000/profile", {
                method: "DELETE",
                credentials: "include"
            });
            const data = await response.json();
            console.log("Status:", response.status);
            console.log(data.message);
            if(response.ok){
                alert("Data Successfully Deleted");
                document.getElementById("name").value = "";
                document.getElementById("Id").value = "";
                document.getElementById("psw").value = "";
                window.location.href="login.html";
            }
        }
        catch(arr){
            message.innerText = "Something went wrong: " + arr.message;
        }
        }
    }
});