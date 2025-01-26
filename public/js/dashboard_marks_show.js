$(document).ready(() => {
    $.get("/chart-data", (data) => {
        const labels = data.map(item => item.label);
        const values = data.map(item => item.value);
        console.log(data);

        const ctx = document.getElementById("classChart").getContext("2d");

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Number of Students",
                    data: values,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }).fail((jqXHR, textStatus, errorThrown) => {
        console.error("Error fetching chart data: ", textStatus, errorThrown);
    });
});