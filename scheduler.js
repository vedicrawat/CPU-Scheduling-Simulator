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
        this.currentProcess = null;
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

    // Preemptive SJF (Shortest Remaining Time First)
    preemptiveSJF() {
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        
        while (remainingProcesses.length > 0) {
            // Get all processes that have arrived
            const arrivedProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
            
            if (arrivedProcesses.length === 0) {
                currentTime++;
                continue;
            }
            
            // Find process with shortest remaining time
            const nextProcess = arrivedProcesses.reduce((prev, curr) => 
                prev.remainingTime < curr.remainingTime ? prev : curr
            );
            
            // If process is running and new process has shorter remaining time, preempt
            if (this.currentProcess && this.currentProcess !== nextProcess && 
                this.currentProcess.remainingTime > nextProcess.remainingTime) {
                
                // Update current process's time
                this.currentProcess.waitingTime += currentTime - this.currentProcess.startTime;
                this.currentProcess.startTime = -1; // Reset start time
                
                // Update next process's time
                nextProcess.startTime = currentTime;
                nextProcess.waitingTime = nextProcess.startTime - nextProcess.arrivalTime;
                
                this.currentProcess = nextProcess;
            }
            
            // If no process is running, start new process
            if (!this.currentProcess) {
                nextProcess.startTime = currentTime;
                nextProcess.waitingTime = nextProcess.startTime - nextProcess.arrivalTime;
                this.currentProcess = nextProcess;
            }
            
            // Execute current process for one unit of time
            this.currentProcess.remainingTime--;
            currentTime++;
            
            // If process is complete
            if (this.currentProcess.remainingTime === 0) {
                this.currentProcess.completionTime = currentTime;
                this.currentProcess.turnaroundTime = this.currentProcess.completionTime - this.currentProcess.arrivalTime;
                this.currentProcess.responseTime = this.currentProcess.startTime - this.currentProcess.arrivalTime;
                
                const index = remainingProcesses.indexOf(this.currentProcess);
                remainingProcesses.splice(index, 1);
                this.currentProcess = null;
            }
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

    // Preemptive Priority Scheduling
    preemptivePriority() {
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        
        while (remainingProcesses.length > 0) {
            // Get all processes that have arrived
            const arrivedProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
            
            if (arrivedProcesses.length === 0) {
                currentTime++;
                continue;
            }
            
            // Find process with highest priority (lowest number)
            const nextProcess = arrivedProcesses.reduce((prev, curr) => 
                prev.priority < curr.priority ? prev : curr
            );
            
            // If process is running and new process has higher priority, preempt
            if (this.currentProcess && this.currentProcess !== nextProcess && 
                this.currentProcess.priority > nextProcess.priority) {
                
                // Update current process's time
                this.currentProcess.waitingTime += currentTime - this.currentProcess.startTime;
                this.currentProcess.startTime = -1; // Reset start time
                
                // Update next process's time
                nextProcess.startTime = currentTime;
                nextProcess.waitingTime = nextProcess.startTime - nextProcess.arrivalTime;
                
                this.currentProcess = nextProcess;
            }
            
            // If no process is running, start new process
            if (!this.currentProcess) {
                nextProcess.startTime = currentTime;
                nextProcess.waitingTime = nextProcess.startTime - nextProcess.arrivalTime;
                this.currentProcess = nextProcess;
            }
            
            // Execute current process for one unit of time
            this.currentProcess.remainingTime--;
            currentTime++;
            
            // If process is complete
            if (this.currentProcess.remainingTime === 0) {
                this.currentProcess.completionTime = currentTime;
                this.currentProcess.turnaroundTime = this.currentProcess.completionTime - this.currentProcess.arrivalTime;
                this.currentProcess.responseTime = this.currentProcess.startTime - this.currentProcess.arrivalTime;
                
                const index = remainingProcesses.indexOf(this.currentProcess);
                remainingProcesses.splice(index, 1);
                this.currentProcess = null;
            }
        }
    }

    // Update process table
    updateProcessTable() {
        const tableBody = document.getElementById('process-table-body');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Sort processes by ID
        const sortedProcesses = [...this.processes].sort((a, b) => a.id.localeCompare(b.id));
        
        // Add rows for each process
        sortedProcesses.forEach(process => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // Process ID
            const idCell = document.createElement('td');
            idCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            idCell.textContent = process.id;
            
            // Arrival Time
            const arrivalCell = document.createElement('td');
            arrivalCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            arrivalCell.textContent = process.arrivalTime;
            
            // Burst Time
            const burstCell = document.createElement('td');
            burstCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            burstCell.textContent = process.burstTime;
            
            // Priority
            const priorityCell = document.createElement('td');
            priorityCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            priorityCell.textContent = process.priority;
            
            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-red-600 hover:text-red-800';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => {
                const index = this.processes.indexOf(process);
                if (index > -1) {
                    this.processes.splice(index, 1);
                    this.updateProcessTable();
                }
            };
            actionsCell.appendChild(deleteBtn);
            
            // Add cells to row
            row.appendChild(idCell);
            row.appendChild(arrivalCell);
            row.appendChild(burstCell);
            row.appendChild(priorityCell);
            row.appendChild(actionsCell);
            
            // Add row to table
            tableBody.appendChild(row);
        });
    }

    // Calculate average metrics
    calculateMetrics() {
        const totalProcesses = this.processes.length;
        if (totalProcesses === 0) return {};
        
        // Calculate total times
        const totalWaitingTime = this.processes.reduce((sum, p) => sum + p.waitingTime, 0);
        const totalTurnaroundTime = this.processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
        const totalResponseTime = this.processes.reduce((sum, p) => sum + p.responseTime, 0);
        const totalBurstTime = this.processes.reduce((sum, p) => sum + p.burstTime, 0);
        
        // Calculate CPU Utilization
        const maxCompletionTime = Math.max(...this.processes.map(p => p.completionTime));
        const cpuUtilization = ((totalBurstTime / maxCompletionTime) * 100).toFixed(2);
        
        // Calculate Throughput
        const throughput = (totalProcesses / maxCompletionTime).toFixed(2);
        
        return {
            avgWaitingTime: (totalWaitingTime / totalProcesses).toFixed(2),
            avgTurnaroundTime: (totalTurnaroundTime / totalProcesses).toFixed(2),
            avgResponseTime: (totalResponseTime / totalProcesses).toFixed(2),
            cpuUtilization: cpuUtilization,
            throughput: throughput,
            totalProcesses: totalProcesses,
            maxCompletionTime: maxCompletionTime
        };
    }

    // Update metrics display
    updateMetricsDisplay(metrics) {
        const elements = {
            'avg-waiting-time': `${metrics.avgWaitingTime} ms`,
            'avg-turnaround-time': `${metrics.avgTurnaroundTime} ms`,
            'avg-response-time': `${metrics.avgResponseTime} ms`,
            'cpu-utilization': `${metrics.cpuUtilization}%`,
            'throughput': `${metrics.throughput} processes/unit time`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Generate Gantt chart using HTML/CSS with animation
    renderGanttChart() {
        const ganttBars = document.getElementById('gantt-bars');
        const timeLabels = document.getElementById('time-labels');
        if (!ganttBars || !timeLabels) return;
        
        // Clear existing bars and labels
        ganttBars.innerHTML = '';
        timeLabels.innerHTML = '';
        
        // Sort processes by start time
        const sortedProcesses = [...this.processes].sort((a, b) => a.startTime - b.startTime);
        
        // Find max completion time for scaling
        const maxTime = Math.max(...this.processes.map(p => p.completionTime));
        const timeInterval = Math.ceil(maxTime / 5); // Show 5 time labels
        
        // Add time labels
        for (let i = 0; i <= maxTime; i += timeInterval) {
            const label = document.createElement('div');
            label.className = 'flex-1 text-center';
            label.textContent = i;
            timeLabels.appendChild(label);
        }
        
        // Generate color palette
        const generateColor = (id) => {
            const hue = (id * 30) % 360; // Different hue for each process
            return `hsl(${hue}, 70%, 50%)`;
        };
        
        // Create process bars
        const processBars = {};
        sortedProcesses.forEach(process => {
            const barContainer = document.createElement('div');
            barContainer.className = 'flex items-center';
            
            // Add process ID label
            const label = document.createElement('div');
            label.className = 'w-16 text-right pr-4 text-sm font-medium';
            label.textContent = `P${process.id}`;
            
            // Create bar container
            const barWrapper = document.createElement('div');
            barWrapper.className = 'flex-1 relative h-4 bg-gray-200 rounded';
            
            // Create process bar
            const bar = document.createElement('div');
            const color = generateColor(process.id);
            bar.className = 'absolute h-full rounded transition-all duration-300';
            bar.style.backgroundColor = color;
            
            // Calculate initial position
            const startTime = process.startTime;
            const barLeft = (startTime / maxTime) * 100;
            
            // Set initial position
            bar.style.width = '0%';
            bar.style.left = `${barLeft}%`;
            
            // Add tooltip with process details
            bar.title = `Process P${process.id}\n` +
                        `Start Time: ${process.startTime}\n` +
                        `End Time: ${process.completionTime}\n` +
                        `Duration: ${process.burstTime}\n` +
                        `Waiting Time: ${process.waitingTime}`;
            
            // Add hover effect
            bar.addEventListener('mouseenter', () => {
                bar.style.transform = 'scaleX(1.05)';
            });
            
            bar.addEventListener('mouseleave', () => {
                bar.style.transform = 'scaleX(1)';
            });
            
            // Store bar reference
            processBars[process.id] = bar;
            
            // Add elements to container
            barWrapper.appendChild(bar);
            barContainer.appendChild(label);
            barContainer.appendChild(barWrapper);
            
            // Add to gantt bars
            ganttBars.appendChild(barContainer);
        });

        // Animation function
        const animateProcess = (process, currentTime) => {
            const bar = processBars[process.id];
            if (!bar) return;
            
            // Calculate progress
            const progress = Math.min(
                ((currentTime - process.startTime) / process.burstTime) * 100,
                100
            );
            
            // Update bar width
            bar.style.width = `${progress}%`;
            
            // Add pulsing effect when process is executing
            if (currentTime >= process.startTime && currentTime < process.completionTime) {
                bar.style.animation = 'pulse 1s infinite';
            } else {
                bar.style.animation = '';
            }
        };

        // Animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        // Start animation
        const animationInterval = 500; // 500ms per time unit
        let currentTime = 0;
        const maxCompletionTime = Math.max(...this.processes.map(p => p.completionTime));
        
        const animation = setInterval(() => {
            // Update all process bars
            sortedProcesses.forEach(process => {
                animateProcess(process, currentTime);
            });
            
            // Update current time
            currentTime++;
            
            // Stop animation when all processes are complete
            if (currentTime > maxCompletionTime) {
                clearInterval(animation);
            }
        }, animationInterval);
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
const ganttChartContainer = document.querySelector('#ganttChart');

// Add keyboard navigation for input fields
const inputFields = [processIdInput, burstTimeInput, priorityInput, arrivalTimeInput];

// Function to move focus to next field
function moveToNextField(currentField) {
    const currentIndex = inputFields.indexOf(currentField);
    if (currentIndex >= 0 && currentIndex < inputFields.length - 1) {
        inputFields[currentIndex + 1].focus();
    } else if (currentIndex === inputFields.length - 1) {
        // If last field, submit the form
        addProcessBtn.click();
    }
}

// Add event listeners for Enter key
inputFields.forEach((input, index) => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            moveToNextField(input);
        }
    });
});

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
    const existingProcess = scheduler.processes.find(p => p.id === id);
    if (existingProcess) {
        alert('Process ID already exists. Please use a different ID.');
        return;
    }

    // Add process to scheduler
    scheduler.addProcess(id, arrivalTime, burstTime, priority);
    
    // Update the process table
    scheduler.updateProcessTable();
    
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
    
    // Run selected algorithm
    switch(algorithm) {
        case 'FCFS':
            scheduler.fcfs();
            break;
        case 'SJF':
            scheduler.sjf();
            break;
        case 'Preemptive SJF':
            scheduler.preemptiveSJF();
            break;
        case 'Round Robin':
            scheduler.roundRobin();
            break;
        case 'Priority':
            scheduler.priorityScheduling();
            break;
        case 'Preemptive Priority':
            scheduler.preemptivePriority();
            break;
    }
    
    // Update Gantt chart
    scheduler.renderGanttChart();
    
    // Calculate and display metrics
    const metrics = scheduler.calculateMetrics();
    scheduler.updateMetricsDisplay(metrics);
    
    // Scroll to Gantt chart section
    const ganttSection = document.getElementById('gantt-section');
    if (ganttSection) {
        ganttSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
