// Process class to store process details
class Process {
    constructor(id, arrivalTime, burstTime, priority) {
        this.id = id;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.priority = priority;
        this.remainingTime = burstTime;
        this.startTime = -1;
        this.completionTime = -1;
        this.waitingTime = 0;
        this.turnaroundTime = 0;
        this.responseTime = 0;
    }
}

// Scheduling Algorithms
class Scheduler {
    constructor() {
        this.processes = [];
        this.algorithm = 'FCFS';
        this.timeQuantum = 4; // Default time quantum for Round Robin
    }

    // Add new process
    addProcess(id, arrivalTime, burstTime, priority) {
        this.processes.push(new Process(id, arrivalTime, burstTime, priority));
    }

    // First-Come-First-Served (FCFS)
    fcfs() {
        // Sort by arrival time
        this.processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let currentTime = 0;
        
        this.processes.forEach(process => {
            process.startTime = Math.max(currentTime, process.arrivalTime);
            process.completionTime = process.startTime + process.burstTime;
            process.waitingTime = process.startTime - process.arrivalTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.responseTime = process.startTime - process.arrivalTime;
            currentTime = process.completionTime;
        });
    }

    // Shortest Job First (SJF)
    sjf() {
        // Sort by arrival time first
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        
        while (remainingProcesses.length > 0) {
            // Filter processes that have arrived
            const arrivedProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
            
            if (arrivedProcesses.length === 0) {
                currentTime++;
                continue;
            }
            
            // Find process with shortest burst time
            const nextProcess = arrivedProcesses.reduce((prev, curr) => 
                prev.burstTime < curr.burstTime ? prev : curr
            );
            
            const index = remainingProcesses.indexOf(nextProcess);
            remainingProcesses.splice(index, 1);
            
            nextProcess.startTime = currentTime;
            nextProcess.completionTime = currentTime + nextProcess.burstTime;
            nextProcess.waitingTime = nextProcess.startTime - nextProcess.arrivalTime;
            nextProcess.turnaroundTime = nextProcess.completionTime - nextProcess.arrivalTime;
            nextProcess.responseTime = nextProcess.startTime - nextProcess.arrivalTime;
            
            currentTime = nextProcess.completionTime;
        }
    }

    // Round Robin
    roundRobin() {
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        let completedProcesses = [];
        
        while (remainingProcesses.length > 0) {
            // Process each process for time quantum
            for (let i = 0; i < remainingProcesses.length; i++) {
                const process = remainingProcesses[i];
                
                // Skip if process hasn't arrived
                if (process.arrivalTime > currentTime) continue;
                
                // First time this process is executed
                if (process.startTime === -1) {
                    process.startTime = currentTime;
                    process.responseTime = process.startTime - process.arrivalTime;
                }
                
                // Execute for time quantum or remaining time
                const timeToExecute = Math.min(process.remainingTime, this.timeQuantum);
                process.remainingTime -= timeToExecute;
                currentTime += timeToExecute;
                
                // If process is completed
                if (process.remainingTime === 0) {
                    process.completionTime = currentTime;
                    process.waitingTime = process.completionTime - process.arrivalTime - process.burstTime;
                    process.turnaroundTime = process.completionTime - process.arrivalTime;
                    
                    completedProcesses.push(process);
                    remainingProcesses.splice(i, 1);
                    i--;
                }
            }
        }
        
        // Update processes array with completed processes
        this.processes = completedProcesses;
    }

    // Priority Scheduling
    priorityScheduling() {
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        
        while (remainingProcesses.length > 0) {
            // Filter processes that have arrived
            const arrivedProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
            
            if (arrivedProcesses.length === 0) {
                currentTime++;
                continue;
            }
            
            // Find process with highest priority (lowest number)
            const nextProcess = arrivedProcesses.reduce((prev, curr) => 
                prev.priority < curr.priority ? prev : curr
            );
            
            const index = remainingProcesses.indexOf(nextProcess);
            remainingProcesses.splice(index, 1);
            
            nextProcess.startTime = currentTime;
            nextProcess.completionTime = currentTime + nextProcess.burstTime;
            nextProcess.waitingTime = nextProcess.startTime - nextProcess.arrivalTime;
            nextProcess.turnaroundTime = nextProcess.completionTime - nextProcess.arrivalTime;
            nextProcess.responseTime = nextProcess.startTime - nextProcess.arrivalTime;
            
            currentTime = nextProcess.completionTime;
        }
    }

    // Calculate average metrics
    calculateMetrics() {
        const totalProcesses = this.processes.length;
        const totalWaitingTime = this.processes.reduce((sum, p) => sum + p.waitingTime, 0);
        const totalTurnaroundTime = this.processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
        const totalResponseTime = this.processes.reduce((sum, p) => sum + p.responseTime, 0);
        
        return {
            avgWaitingTime: (totalWaitingTime / totalProcesses).toFixed(2),
            avgTurnaroundTime: (totalTurnaroundTime / totalProcesses).toFixed(2),
            avgResponseTime: (totalResponseTime / totalProcesses).toFixed(2),
            cpuUtilization: ((totalProcesses * 100) / (this.processes[this.processes.length - 1].completionTime)).toFixed(2)
        };
    }

    // Generate Gantt Chart
    generateGanttChart() {
        const chart = document.getElementById('gantt-chart');
        if (!chart) return;
        
        const metrics = this.calculateMetrics();
        
        // Clear existing chart
        chart.innerHTML = '';
        
        // Create Gantt Chart
        const gantt = document.createElement('div');
        gantt.className = 'w-full bg-gray-100 rounded-lg p-4';
        
        // Create timeline
        const timeline = document.createElement('div');
        timeline.className = 'flex justify-between text-sm text-gray-500 mb-4';
        timeline.innerHTML = `
            <span>0</span>
            <span>${this.processes[this.processes.length - 1].completionTime}</span>
        `;
        gantt.appendChild(timeline);
        
        // Create process bars
        this.processes.forEach(process => {
            const bar = document.createElement('div');
            bar.className = 'flex items-center mb-2';
            
            // Create label
            const label = document.createElement('div');
            label.className = 'w-16 text-right pr-4';
            label.textContent = `P${process.id}`;
            bar.appendChild(label);
            
            // Create bar container
            const barContainer = document.createElement('div');
            barContainer.className = 'flex-1 h-4 bg-gray-200 rounded';
            
            // Create bar
            const barElement = document.createElement('div');
            barElement.className = 'h-full bg-blue-500 rounded';
            barElement.style.width = `${(process.completionTime - process.arrivalTime) * 100 / this.processes[this.processes.length - 1].completionTime}%`;
            barContainer.appendChild(barElement);
            
            bar.appendChild(barContainer);
            gantt.appendChild(bar);
        });
        
        // Add metrics
        const metricsDiv = document.createElement('div');
        metricsDiv.className = 'mt-4 text-sm text-gray-600';
        metricsDiv.innerHTML = `
            <p>Average Waiting Time: ${metrics.avgWaitingTime} ms</p>
            <p>Average Turnaround Time: ${metrics.avgTurnaroundTime} ms</p>
            <p>Average Response Time: ${metrics.avgResponseTime} ms</p>
            <p>CPU Utilization: ${metrics.cpuUtilization}%</p>
        `;
        gantt.appendChild(metricsDiv);
        
        chart.appendChild(gantt);
    }
}

// Initialize scheduler
const scheduler = new Scheduler();

// DOM Elements
const algorithmSelect = document.querySelector('.algorithm-select');
const timeQuantumInput = document.querySelector('.time-quantum');
const addProcessBtn = document.querySelector('.add-process-btn');
const simulateBtn = document.querySelector('.simulate-btn');

// Process input fields
const processIdInput = document.querySelector('.process-id');
const burstTimeInput = document.querySelector('.burst-time');
const priorityInput = document.querySelector('.priority');
const arrivalTimeInput = document.querySelector('.arrival-time');

// Gantt chart container
const ganttChartContainer = document.querySelector('#gantt-chart');

// Event listener for algorithm selection change
algorithmSelect.addEventListener('change', function() {
    // Show time quantum input only for Round Robin
    if (this.value === 'Round Robin') {
        timeQuantumInput.classList.remove('hidden');
    } else {
        timeQuantumInput.classList.add('hidden');
    }
});

// Event listener for adding processes
addProcessBtn.addEventListener('click', function() {
    const id = processIdInput.value.trim();
    const arrivalTime = parseInt(arrivalTimeInput.value);
    const burstTime = parseInt(burstTimeInput.value);
    const priority = parseInt(priorityInput.value);

    // Validate inputs
    if (!id || !arrivalTimeInput.value || !burstTimeInput.value || !priorityInput.value) {
        alert('Please fill in all fields');
        return;
    }

    // Validate process ID
    if (!/^[A-Za-z0-9]+$/.test(id)) {
        alert('Process ID must contain only letters and numbers');
        processIdInput.classList.add('border-red-500');
        return;
    }
    processIdInput.classList.remove('border-red-500');

    // Validate arrival time
    if (isNaN(arrivalTime) || arrivalTime < 0) {
        alert('Arrival time must be a non-negative number');
        arrivalTimeInput.classList.add('border-red-500');
        return;
    }
    arrivalTimeInput.classList.remove('border-red-500');

    // Validate burst time
    if (isNaN(burstTime) || burstTime <= 0) {
        alert('Burst time must be a positive number');
        burstTimeInput.classList.add('border-red-500');
        return;
    }
    burstTimeInput.classList.remove('border-red-500');

    // Validate priority
    if (isNaN(priority) || priority < 0) {
        alert('Priority must be a non-negative number');
        priorityInput.classList.add('border-red-500');
        return;
    }
    priorityInput.classList.remove('border-red-500');

    // Check for duplicate process ID
    if (scheduler.processes.some(p => p.id === id)) {
        alert('Process ID already exists. Please use a different ID.');
        return;
    }

    // Add process to scheduler
    scheduler.addProcess(id, arrivalTime, burstTime, priority);
    
    // Clear input fields
    processIdInput.value = '';
    burstTimeInput.value = '';
    priorityInput.value = '';
    arrivalTimeInput.value = '';
    
    // Update UI to show process was added
    alert('Process added successfully!');
});

// Event listener for simulation
simulateBtn.addEventListener('click', function() {
    // Get selected algorithm
    const algorithm = algorithmSelect.value;
    
    // Validate number of processes
    if (scheduler.processes.length === 0) {
        alert('Please add at least one process');
        return;
    }

    // Validate time quantum for Round Robin
    if (algorithm === 'Round Robin') {
        const timeQuantum = parseInt(timeQuantumInput.querySelector('input').value);
        if (isNaN(timeQuantum) || timeQuantum <= 0) {
            alert('Time quantum must be a positive number');
            timeQuantumInput.querySelector('input').classList.add('border-red-500');
            return;
        }
        timeQuantumInput.querySelector('input').classList.remove('border-red-500');
        scheduler.timeQuantum = timeQuantum;
    }

    // Run selected algorithm
    switch (algorithm) {
        case 'FCFS':
            scheduler.fcfs();
            break;
        case 'SJF':
            scheduler.sjf();
            break;
        case 'Round Robin':
            scheduler.roundRobin();
            break;
        case 'Priority':
            scheduler.priorityScheduling();
            break;
    }

    // Generate Gantt chart
    scheduler.generateGanttChart();

    // Display metrics
    const metrics = scheduler.calculateMetrics();
    const metricsDiv = document.createElement('div');
    metricsDiv.className = 'mt-4';
    metricsDiv.innerHTML = `
        <h3 class="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <div class="space-y-2">
            <div class="flex justify-between">
                <span class="text-gray-600">Average Waiting Time</span>
                <span class="font-medium text-gray-900">${metrics.avgWaitingTime} units</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Average Turnaround Time</span>
                <span class="font-medium text-gray-900">${metrics.avgTurnaroundTime} units</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Average Response Time</span>
                <span class="font-medium text-gray-900">${metrics.avgResponseTime} units</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">CPU Utilization</span>
                <span class="font-medium text-gray-900">${metrics.cpuUtilization}%</span>
            </div>
        </div>
    `;
    ganttChartContainer.appendChild(metricsDiv);
});

// Initialize the page
function init() {
    // Hide time quantum input initially
    if (algorithmSelect.value !== 'Round Robin') {
        timeQuantumInput.classList.add('hidden');
    }
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);