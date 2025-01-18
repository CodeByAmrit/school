// dashboard.js

document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('marksChart').getContext('2d');

    const labels = ['Term 1', 'Term 2', 'Term 3'];
    const data = [
        <%= marks_summary && marks_summary.avg_percentage_term1 ? marks_summary.avg_percentage_term1.toFixed(2) : 0 %>,
        <%= marks_summary && marks_summary.avg_percentage_term2 ? marks_summary.avg_percentage_term2.toFixed(2) : 0 %>,
        <%= marks_summary && marks_summary.avg_percentage_term3 ? marks_summary.avg_percentage_term3.toFixed(2) : 0 %>
    ];

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Marks',
                data: data,
                backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
                borderColor: ['#388E3C', '#FF5722', '#D32F2F'],
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
});
