const id = document.getElementById("school_id").value;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("marks1_form");
    const saveButton = form.querySelector("button[type='button']");
    const loadingIcon = saveButton.querySelector("svg");

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent default form submission
        saveButton.disabled = true; // Disable the button
        loadingIcon.classList.remove("hidden"); // Show the loading spinner

        document.getElementById("marks1_button").innerText = "Loading..."

        let data = {};

        data["english1"] = document.getElementById("english").value;
        data["hindi1"] = document.getElementById("hindi").value;
        data["mathematics1"] = document.getElementById("maths").value;
        data["social_science1"] = document.getElementById("sst").value;
        data["science1"] = document.getElementById("science").value;
        data["computer1"] = document.getElementById("computer").value;
        data["gn1"] = document.getElementById("general").value;
        data["grandTotal1"] = document.getElementById("grand_total").value;
        data["drawing1"] = document.getElementById("drawing").value;
        data["percentage1"] = document.getElementById("percentage").value;
        data["rank1"] = document.getElementById("rank").value;
        data["remarks1"] = document.getElementById("remarks1").value;

        try {
            // Send the data to your backend
            const response = await fetch(`/student/marks1/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Data submitted successfully!");
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
        } finally {
            saveButton.disabled = false; // Enable the button
            loadingIcon.classList.add("hidden"); // Hide the loading spinner
            document.getElementById("marks1_button").innerText = "Save"
        }
    });

    saveButton.addEventListener("click", () => {
        form.dispatchEvent(new Event("submit")); // Trigger form submission
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const form2 = document.getElementById("marks2_form");
    const saveButton2 = form2.querySelector("button[type='button']");
    const loadingIcon2 = saveButton2.querySelector("svg");

    form2.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent default form submission
        saveButton2.disabled = true; // Disable the button
        loadingIcon2.classList.remove("hidden"); // Show the loading spinner

        document.getElementById("marks2_button").innerText = "Loading..."

        let data2 = {};

        data2["english2"] = document.getElementById("english2").value;
        data2["hindi2"] = document.getElementById("hindi2").value;
        data2["mathematics2"] = document.getElementById("maths2").value;
        data2["social_science2"] = document.getElementById("sst2").value;
        data2["science2"] = document.getElementById("science2").value;
        data2["computer2"] = document.getElementById("computer2").value;
        data2["gn2"] = document.getElementById("general2").value;
        data2["drawing2"] = document.getElementById("drawing2").value;
        data2["grandTotal2"] = document.getElementById("grand_total2").value;
        data2["percentage2"] = document.getElementById("percentage2").value;
        data2["rank2"] = document.getElementById("rank2").value;
        data2["remarks2"] = document.getElementById("remarks2").value;

        try {
            // Send the data to your backend
            const response = await fetch(`/student/marks2/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data2),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Data submitted successfully!");
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
        } finally {
            saveButton2.disabled = false; // Enable the button
            loadingIcon2.classList.add("hidden"); // Hide the loading spinner
            document.getElementById("marks2_button").innerText = "Save"
        }
    });

    saveButton2.addEventListener("click", () => {
        form2.dispatchEvent(new Event("submit")); // Trigger form submission
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const form3 = document.getElementById("marks3_form");
    const saveButton3 = form3.querySelector("button[type='button']");
    const loadingIcon3 = saveButton3.querySelector("svg");

    form3.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent default form submission
        saveButton3.disabled = true; // Disable the button
        loadingIcon3.classList.remove("hidden"); // Show the loading spinner

        document.getElementById("marks3_button").innerText = "Loading..."

        let data3 = {};

        data3["english3"] = document.getElementById("english3").value;
        data3["hindi3"] = document.getElementById("hindi3").value;
        data3["mathematics3"] = document.getElementById("maths3").value;
        data3["social_science3"] = document.getElementById("sst3").value;
        data3["science3"] = document.getElementById("science3").value;
        data3["computer3"] = document.getElementById("computer3").value;
        data3["gn3"] = document.getElementById("general3").value;
        data3["drawing3"] = document.getElementById("drawing3").value;
        data3["grandTotal3"] = document.getElementById("grand_total3").value;
        data3["percentage3"] = document.getElementById("percentage3").value;
        data3["rank3"] = document.getElementById("rank3").value;
        data3["remarks3"] = document.getElementById("remarks3").value;

        try {
            // Send the data to your backend
            const response = await fetch(`/student/marks3/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data3),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Data submitted successfully!");
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
        } finally {
            saveButton3.disabled = false; // Enable the button
            loadingIcon3.classList.add("hidden"); // Hide the loading spinner
            document.getElementById("marks3_button").innerText = "Save"
        }
    });

    saveButton3.addEventListener("click", () => {
        form3.dispatchEvent(new Event("submit")); // Trigger form submission
    });
});

