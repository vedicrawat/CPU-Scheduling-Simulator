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
        this.timeQuantum = 2; // Default time quantum for Round Robin
        this.currentProcess = null;
        this.currentTime = 0;
        this.waitingTime = {};
        this.turnaroundTime = {};
        this.responseTime = {};
        this.isStepByStep = false;
        this.currentStep = 0;
        this.steps = [];
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
        
        for (const process of this.processes) {
            // Process starts at the later of current time or its arrival time
            process.startTime = Math.max(currentTime, process.arrivalTime);
            process.completionTime = process.startTime + process.burstTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
            process.responseTime = process.startTime - process.arrivalTime;
            
            // Move current time to completion time of current process
            currentTime = process.completionTime;
        }
    }

    // Shortest Job First (SJF)
    sjf() {
        // Sort by arrival time first
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        
        // Sort processes by arrival time to handle them in order
        remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
        
        while (remainingProcesses.length > 0) {
            // Filter processes that have arrived by current time
            const arrivedProcesses = remainingProcesses
                .filter(p => p.arrivalTime <= currentTime);
            
            // If no processes have arrived yet, move time forward
            if (arrivedProcesses.length === 0) {
                // Find the next arriving process and jump to its arrival time
                const nextArrival = Math.min(...remainingProcesses.map(p => p.arrivalTime));
                currentTime = nextArrival;
                continue;
            }
            
            // Find process with shortest burst time
            const nextProcess = arrivedProcesses.reduce((prev, curr) => 
                (prev.burstTime < curr.burstTime) ? prev : curr
            );
            
            // Calculate metrics for the selected process
            nextProcess.startTime = currentTime;
            nextProcess.completionTime = currentTime + nextProcess.burstTime;
            nextProcess.turnaroundTime = nextProcess.completionTime - nextProcess.arrivalTime;
            nextProcess.waitingTime = nextProcess.turnaroundTime - nextProcess.burstTime;
            nextProcess.responseTime = nextProcess.startTime - nextProcess.arrivalTime;
            
            // Update current time and remove the completed process
            currentTime = nextProcess.completionTime;
            const index = remainingProcesses.findIndex(p => p.id === nextProcess.id);
            if (index !== -1) {
                remainingProcesses.splice(index, 1);
            }
        }
    }

    // Preemptive SJF (Shortest Remaining Time First)
    preemptiveSJF() {
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        let lastProcessedTime = -1;
        
        while (remainingProcesses.length > 0) {
            // Get all processes that have arrived
            const arrivedProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
            
            // If no processes have arrived yet, move time forward
            if (arrivedProcesses.length === 0) {
                currentTime++;
                continue;
            }
            
            // Find process with shortest remaining time
            // In case of tie, choose the one that arrived first
            const nextProcess = arrivedProcesses.reduce((prev, curr) => {
                if (prev.remainingTime < curr.remainingTime) return prev;
                if (prev.remainingTime > curr.remainingTime) return curr;
                // If remaining times are equal, choose the one that arrived first
                return prev.arrivalTime <= curr.arrivalTime ? prev : curr;
            });
            
            // Check for potential infinite loop
            if (currentTime > 1000) {  // Safety check to prevent infinite loops
                console.error('Infinite loop detected in preemptiveSJF');
                remainingProcesses.forEach(p => {
                    p.completionTime = currentTime + p.remainingTime;
                    p.turnaroundTime = p.completionTime - p.arrivalTime;
                    p.waitingTime = p.turnaroundTime - p.burstTime;
                    p.responseTime = p.waitingTime; // For non-preemptive, response = waiting
                });
                break;
            }
            
            // If we're switching processes or starting a new one
            if (!this.currentProcess || this.currentProcess.id !== nextProcess.id) {
                // If there was a previous process, update its waiting time
                if (this.currentProcess && this.currentProcess.remainingTime > 0) {
                    this.currentProcess.waitingTime += currentTime - lastProcessedTime - 1;
                }
                
                // Set up the new process
                this.currentProcess = nextProcess;
                if (this.currentProcess.startTime === -1) {
                    this.currentProcess.startTime = currentTime;
                    this.currentProcess.responseTime = this.currentProcess.startTime - this.currentProcess.arrivalTime;
                }
            }
            
            // Execute current process for one unit of time
            this.currentProcess.remainingTime--;
            lastProcessedTime = currentTime;
            currentTime++;
            
            // If process is complete
            if (this.currentProcess.remainingTime === 0) {
                this.currentProcess.completionTime = currentTime;
                this.currentProcess.turnaroundTime = this.currentProcess.completionTime - this.currentProcess.arrivalTime;
                this.currentProcess.waitingTime = this.currentProcess.turnaroundTime - this.currentProcess.burstTime;
                
                // Remove from remaining processes
                const index = remainingProcesses.findIndex(p => p.id === this.currentProcess.id);
                if (index !== -1) {
                    remainingProcesses.splice(index, 1);
                }
                
                this.currentProcess = null;
            }
        }
    }

    // Round Robin
    roundRobin() {
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        let completedProcesses = [];
        let queue = [];
        let lastProcessed = null;
        
        // Sort processes by arrival time
        remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
        
        // Continue until all processes are completed
        while (remainingProcesses.length > 0 || queue.length > 0) {
            // Add newly arrived processes to the queue
            while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= currentTime) {
                const process = remainingProcesses.shift();
                queue.push(process);
            }
            
            // If no processes are ready but some are remaining
            if (queue.length === 0) {
                if (remainingProcesses.length > 0) {
                    currentTime = remainingProcesses[0].arrivalTime;
                    continue;
                } else {
                    break;
                }
            }
            
            // Get the next process from the queue
            const currentProcess = queue.shift();
            
            // Record start time if this is the first time the process is running
            if (currentProcess.startTime === -1) {
                currentProcess.startTime = currentTime;
                currentProcess.responseTime = currentProcess.startTime - currentProcess.arrivalTime;
            }
            
            // Execute for time quantum or remaining time, whichever is smaller
            const executionTime = Math.min(currentProcess.remainingTime, this.timeQuantum);
            currentProcess.remainingTime -= executionTime;
            currentTime += executionTime;
            
            // Check if process is completed
            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                
                // Add to completed processes
                completedProcesses.push(currentProcess);
                
                // Remove from remaining processes
                const index = remainingProcesses.findIndex(p => p.id === currentProcess.id);
                if (index !== -1) {
                    remainingProcesses.splice(index, 1);
                }
            } else {
                // Add newly arrived processes to the queue
                while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= currentTime) {
                    const process = remainingProcesses.shift();
                    queue.push(process);
                }
                
                // Add the current process back to the queue if it's not finished
                queue.push(currentProcess);
            }
        }
        
        // Update processes array with completed processes
        this.processes = completedProcesses;
    }

    // Priority Scheduling (Non-preemptive)
    priorityScheduling() {
        let currentTime = 0;
        let remainingProcesses = [...this.processes];
        
        // Sort processes by arrival time
        remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
        
        while (remainingProcesses.length > 0) {
            // Filter processes that have arrived by current time
            const arrivedProcesses = remainingProcesses
                .filter(p => p.arrivalTime <= currentTime);
            
            // If no processes have arrived yet, move to next arrival time
            if (arrivedProcesses.length === 0) {
                const nextArrival = Math.min(...remainingProcesses.map(p => p.arrivalTime));
                currentTime = nextArrival;
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
            totalProcesses: this.processes.length,
            totalTime: maxCompletionTime
        };
    }

    // Update metrics display
    updateMetricsDisplay(metrics) {
        if (!metrics) return;
        
        // Update summary cards
        const elements = {
            'avg-waiting-time': `${metrics.avgWaitingTime} ms`,
            'avg-turnaround-time': `${metrics.avgTurnaroundTime} ms`,
            'avg-response-time': `${metrics.avgResponseTime || '0'} ms`,
            'cpu-utilization': `${metrics.cpuUtilization || '0'}%`,
            'throughput': `${metrics.throughput} processes/unit time`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update process details table
        const processDetails = document.getElementById('process-details');
        if (processDetails) {
            processDetails.innerHTML = ''; // Clear existing rows
            
            this.processes.forEach(process => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${process.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.arrivalTime}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.burstTime}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.priority || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.startTime !== -1 ? process.startTime : '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.completionTime !== -1 ? process.completionTime : '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.waitingTime || '0'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.completionTime !== -1 ? (process.completionTime - process.arrivalTime) : '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.responseTime !== undefined ? process.responseTime : '-'}</td>
                `;
                processDetails.appendChild(row);
            });
        }
        
        // Scroll to metrics section
        const metricsSection = document.getElementById('metrics-container');
        if (metricsSection) {
            metricsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

// Gantt chart colors for different processes
const processColors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
];

// Animation speed in milliseconds
const ANIMATION_SPEED = 500; // Time for each process animation

// Initialize scheduler
const scheduler = new Scheduler();

// Function to create a single process block with animation
async function createAnimatedBlock(process, index, totalTime, container, delay = 0) {
    return new Promise(resolve => {
        setTimeout(() => {
            const duration = process.completionTime - process.startTime;
            const width = (duration / totalTime) * 100;
            const left = (process.startTime / totalTime) * 100;
            
            // Create process block container
            const blockContainer = document.createElement('div');
            blockContainer.className = 'absolute h-12';
            blockContainer.style.width = `${width}%`;
            blockContainer.style.left = `${left}%`;
            
            // Create the actual process block
            const block = document.createElement('div');
            block.className = `h-full flex items-center justify-center text-white font-bold ${processColors[index % processColors.length]} opacity-0 transition-all duration-300 transform -translate-y-2`;
            block.textContent = `P${process.id}`;
            block.title = `Process ${process.id}\nStart: ${process.startTime}\nEnd: ${process.completionTime}`;
            
            // Add to container
            blockContainer.appendChild(block);
            container.appendChild(blockContainer);
            
            // Trigger animation
            setTimeout(() => {
                block.classList.remove('opacity-0', '-translate-y-2');
                
                // Resolve after animation completes
                setTimeout(() => {
                    resolve();
                }, 300);
            }, 50);
        }, delay);
    });
}

// Function to generate execution sequence for Gantt chart
function getExecutionSequence(processes, algorithm, timeQuantum = 2) {
    if (!processes || processes.length === 0) return [];
    
    // Make a deep copy of processes to avoid modifying the original
    const processesCopy = JSON.parse(JSON.stringify(processes));
    processesCopy.forEach(p => p.remainingTime = p.burstTime);
    
    let currentTime = 0;
    const executionSequence = [];
    const readyQueue = [];
    let currentProcess = null;
    
    // Helper function to add execution segment
    const addExecutionSegment = (process, start, end) => {
        executionSequence.push({
            id: process.id,
            startTime: start,
            endTime: end,
            isNew: process.remainingTime === process.burstTime
        });
    };
    
    // Sort processes by arrival time
    processesCopy.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    // For Round Robin
    if (algorithm === 'Round Robin') {
        const queue = [];
        
        while (true) {
            // Add arrived processes to queue
            while (processesCopy.length > 0 && processesCopy[0].arrivalTime <= currentTime) {
                const p = processesCopy.shift();
                queue.push({...p});
            }
            
            if (currentProcess && currentProcess.remainingTime > 0) {
                queue.push({...currentProcess});
            }
            
            if (queue.length === 0) {
                if (processesCopy.length === 0) break;
                // Handle idle time
                const nextArrival = processesCopy[0].arrivalTime;
                currentTime = nextArrival;
                continue;
            }
            
            currentProcess = queue.shift();
            
            // Record process start if it's the first time
            if (currentProcess.startTime === -1) {
                currentProcess.startTime = currentTime;
            }
            
            // Calculate execution time (minimum of remaining time and time quantum)
            const executionTime = Math.min(currentProcess.remainingTime, timeQuantum);
            const segmentEnd = currentTime + executionTime;
            
            // Add to execution sequence
            addExecutionSegment(currentProcess, currentTime, segmentEnd);
            
            // Update remaining time and current time
            currentProcess.remainingTime -= executionTime;
            currentTime = segmentEnd;
            
            // If process completed, update completion time
            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
            }
        }
    } 
    // For other algorithms
    else {
        // For preemptive algorithms, we need to simulate the execution
        if (algorithm.includes('Preemptive')) {
            const preemptiveQueue = [...processesCopy].sort((a, b) => a.arrivalTime - b.arrivalTime);
            let currentTime = 0;
            let maxIterations = 1000; // Safety limit to prevent infinite loops
            
            while (preemptiveQueue.length > 0 && maxIterations-- > 0) {
                // Get processes that have arrived
                const arrived = preemptiveQueue.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);
                
                if (arrived.length === 0) {
                    currentTime++;
                    continue;
                }
                
                // Sort by remaining time for SJF or priority for Priority
                let nextProcess;
                if (algorithm.includes('SJF')) {
                    nextProcess = arrived.reduce((prev, curr) => 
                        (prev.remainingTime < curr.remainingTime) ? prev : curr
                    );
                } else { // Priority
                    nextProcess = arrived.reduce((prev, curr) => 
                        (prev.priority < curr.priority) ? prev : curr
                    );
                }
                
                // Execute for 1 time unit (preemptive)
                const startTime = currentTime;
                nextProcess.remainingTime--;
                currentTime++;
                
                // Add to execution sequence
                addExecutionSegment(nextProcess, startTime, currentTime);
                
                // If process completed, update completion time
                if (nextProcess.remainingTime === 0) {
                    nextProcess.completionTime = currentTime;
                    preemptiveQueue.splice(preemptiveQueue.indexOf(nextProcess), 1);
                }
            }
        } 
        // For non-preemptive algorithms
        else {
            processesCopy.forEach(process => {
                addExecutionSegment(process, process.startTime, process.completionTime);
            });
        }
    }
    
    return executionSequence.sort((a, b) => a.startTime - b.startTime);
}

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to generate Gantt chart with animation
async function generateGanttChart(processes, algorithm = 'FCFS', timeQuantum = 4) {
    const ganttChart = document.getElementById('gantt-chart');
    const timeline = document.getElementById('gantt-timeline');
    
    // Clear previous content
    ganttChart.innerHTML = '';
    timeline.innerHTML = '';
    
    if (!processes || processes.length === 0) return;
    
    // Show the Gantt chart section
    const ganttSection = document.getElementById('gantt-chart-section');
    ganttSection.classList.remove('hidden');
    
    // Get execution sequence based on algorithm
    const executionSequence = getExecutionSequence(processes, algorithm, timeQuantum);
    
    if (executionSequence.length === 0) {
        console.warn('No execution sequence generated');
        return;
    }
    
    // Calculate total time span
    const lastExecution = executionSequence[executionSequence.length - 1];
    const totalTime = lastExecution.endTime;
    
    // Update process completion times for metrics calculation
    processes.forEach(process => {
        const processExecutions = executionSequence.filter(e => e.id === process.id);
        if (processExecutions.length > 0) {
            const firstExec = processExecutions[0];
            const lastExec = processExecutions[processExecutions.length - 1];
            process.startTime = firstExec.startTime;
            process.completionTime = lastExec.endTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
            process.responseTime = process.startTime - process.arrivalTime;
        }
    });
    
    // Create time points from execution sequence
    const timePoints = new Set([0]);
    executionSequence.forEach(exec => {
        timePoints.add(exec.startTime);
        timePoints.add(exec.endTime);
    });
    
    // Add total time if not already included
    timePoints.add(totalTime);
    
    // Convert to array and sort
    const uniqueTimePoints = Array.from(timePoints).sort((a, b) => a - b);
    
    // Create timeline markers
    uniqueTimePoints.forEach(time => {
        const marker = document.createElement('div');
        marker.className = 'absolute flex flex-col items-center';
        const left = (time / totalTime) * 100;
        marker.style.left = `${left}%`;
        
        const line = document.createElement('div');
        line.className = 'w-px h-4 bg-gray-300';
        
        const timeLabel = document.createElement('span');
        timeLabel.className = 'text-xs text-gray-600 mt-1';
        timeLabel.textContent = time;
        
        marker.appendChild(line);
        marker.appendChild(timeLabel);
        timeline.appendChild(marker);
    });
    
    // Create a progress indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'absolute top-0 left-0 h-full bg-blue-200 opacity-30 transition-all duration-300';
    progressIndicator.style.width = '0%';
    ganttChart.appendChild(progressIndicator);
    
    // Create a grid background
    const grid = document.createElement('div');
    grid.className = 'absolute inset-0 grid';
    grid.style.gridTemplateColumns = `repeat(${uniqueTimePoints.length - 1}, 1fr)`;
    grid.style.gap = '1px';
    
    for (let i = 0; i < uniqueTimePoints.length - 1; i++) {
        const cell = document.createElement('div');
        cell.className = 'h-full bg-gray-50';
        grid.appendChild(cell);
    }
    
    ganttChart.insertBefore(grid, ganttChart.firstChild);
    
    // Create a map to track process colors and execution segments
    const processColorMap = new Map();
    let colorIndex = 0;
    
    // First pass: Assign colors to processes
    executionSequence.forEach(exec => {
        if (!processColorMap.has(exec.id)) {
            processColorMap.set(exec.id, {
                colorIndex: colorIndex % processColors.length,
                segments: []
            });
            colorIndex++;
        }
    });
    
    // Group execution segments by process
    executionSequence.forEach((exec, index) => {
        const processInfo = processColorMap.get(exec.id);
        processInfo.segments.push({
            ...exec,
            index
        });
    });
    
    // Create a grid for the timeline
    const timelineGrid = document.createElement('div');
    timelineGrid.className = 'grid mt-2';
    timelineGrid.style.gridTemplateColumns = `repeat(${uniqueTimePoints.length - 1}, 1fr)`;
    
    // Create timeline segments
    for (let i = 0; i < uniqueTimePoints.length - 1; i++) {
        const timeStart = uniqueTimePoints[i];
        const timeEnd = uniqueTimePoints[i + 1];
        
        const segment = document.createElement('div');
        segment.className = 'border-t border-gray-300 text-center text-xs text-gray-600 pt-1';
        segment.textContent = `${timeStart}`;
        timelineGrid.appendChild(segment);
    }
    
    // Add the final time marker
    const finalMarker = document.createElement('div');
    finalMarker.className = 'text-center text-xs text-gray-600 pt-1';
    finalMarker.textContent = `${uniqueTimePoints[uniqueTimePoints.length - 1]}`;
    timelineGrid.appendChild(finalMarker);
    
    // Add timeline to the container
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'mt-12';
    timelineContainer.appendChild(timelineGrid);
    ganttChart.parentNode.insertBefore(timelineContainer, timeline);
    
    // Function to animate blocks with requestAnimationFrame
    const animateBlocks = async () => {
        const batchSize = 1; // Process 1 block at a time for better visibility
        const delayBetweenBlocks = 300; // Reduced delay for better responsiveness
        
        // Process blocks in a loop instead of recursion
        const processBlocks = async () => {
            for (let i = 0; i < executionSequence.length; i++) {
                const exec = executionSequence[i];
                const processInfo = processColorMap.get(exec.id);
                const colorIndexForProcess = processInfo.colorIndex;
                
                const duration = exec.endTime - exec.startTime;
                const width = (duration / totalTime) * 100;
                const left = (exec.startTime / totalTime) * 100;
                
                // Create process block container
                const blockContainer = document.createElement('div');
                blockContainer.className = 'absolute h-12';
                blockContainer.style.width = `${width}%`;
                blockContainer.style.left = `${left}%`;
                
                // Create process block
                const block = document.createElement('div');
                block.className = `h-full flex flex-col items-center justify-center text-white font-bold ${processColors[colorIndexForProcess]} opacity-0 transition-all duration-300 transform -translate-y-2`;
                block.textContent = `P${exec.id}`;
                block.title = `Process ${exec.id}\nStart: ${exec.startTime}\nEnd: ${exec.endTime}`;
                
                // Add time labels
                const timeLabel = document.createElement('div');
                timeLabel.className = 'text-xs mt-1';
                timeLabel.textContent = `${exec.startTime}-${exec.endTime}`;
                
                block.appendChild(timeLabel);
                blockContainer.appendChild(block);
                
                // Add to container
                ganttChart.appendChild(blockContainer);
                
                // Animate the block using requestAnimationFrame
                requestAnimationFrame(() => {
                    block.classList.remove('opacity-0', '-translate-y-2');
                });
                
                // Update progress indicator
                const progress = ((i + 1) / executionSequence.length) * 100;
                progressIndicator.style.width = `${progress}%`;
                
                // Add delay between blocks for better visibility
                await delay(delayBetweenBlocks);
                
                // Allow UI to update
                if (i % 5 === 0) {
                    await new Promise(resolve => requestAnimationFrame(resolve));
                }
            }
            
            // All done
            progressIndicator.style.width = '100%';
            setTimeout(() => {
                progressIndicator.remove();
            }, 500);
        };
        
        // Start processing
        await processBlocks();
    };
    
    // Show the Gantt chart immediately but wait 2 seconds before starting animations
    await new Promise(resolve => setTimeout(resolve, 2000));
    await animateBlocks();
    
    // Remove progress indicator after animation completes
    setTimeout(() => {
        progressIndicator.remove();
        
        // Add a final marker for the end time if it doesn't exist
        const existingMarkers = Array.from(timeline.querySelectorAll('span'));
        const hasEndMarker = existingMarkers.some(span => parseInt(span.textContent) === totalTime);
        
        if (!hasEndMarker) {
            const marker = document.createElement('div');
            marker.className = 'absolute flex flex-col items-center';
            marker.style.right = '0';
            
            const line = document.createElement('div');
            line.className = 'w-px h-4 bg-gray-300';
            
            const timeLabel = document.createElement('span');
            timeLabel.className = 'text-xs text-gray-600 mt-1';
            timeLabel.textContent = totalTime;
            
            marker.appendChild(line);
            marker.appendChild(timeLabel);
            timeline.appendChild(marker);
        }
    }, 500);
}

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

    // Show algorithm explanation modal
    const algorithm = this.value;
    const modal = document.getElementById('algorithm-modal');
    const content = document.getElementById('algorithm-content');
    const closeButton = document.getElementById('close-modal');

    // Algorithm explanations
    const explanations = {
        'FCFS': {
            title: 'First-Come, First-Served (FCFS)',
            description: 'Processes are executed in the order they arrive in the ready queue.',
            pros: [
                'Simple and easy to implement',
                'No overhead for scheduling decisions',
                'Fair to all processes'
            ],
            cons: [
                'May lead to long waiting times for processes arriving later',
                'Poor average waiting time',
                'Not optimal for CPU utilization'
            ]
        },
        'SJF': {
            title: 'Shortest Job First (SJF)',
            description: 'Processes with the shortest burst time are executed first.',
            pros: [
                'Minimizes average waiting time',
                'Optimal for minimizing average turnaround time',
                'Better CPU utilization'
            ],
            cons: [
                'Can lead to starvation of longer processes',
                'Requires accurate burst time prediction',
                'Non-preemptive version can be unfair'
            ]
        },
        'Preemptive SJF': {
            title: 'Preemptive Shortest Job First (SRTF)',
            description: 'Preemptive version of SJF where processes are interrupted if a shorter process arrives.',
            pros: [
                'Better response time for shorter processes',
                'More efficient than non-preemptive SJF',
                'Reduces waiting time'
            ],
            cons: [
                'More overhead due to preemption',
                'Can cause process thrashing',
                'Complex implementation'
            ]
        },
        'Round Robin': {
            title: 'Round Robin',
            description: 'Processes are executed in a cyclic manner with fixed time slices.',
            pros: [
                'Ensures fair CPU allocation',
                'Prevents process starvation',
                'Good for interactive systems'
            ],
            cons: [
                'Increased overhead due to context switching',
                'Not optimal for CPU-bound processes',
                'Performance depends on time quantum'
            ]
        },
        'Priority': {
            title: 'Priority Scheduling',
            description: 'Processes are executed based on their priority levels.',
            pros: [
                'Flexible and can handle different types of processes',
                'Can prioritize important processes',
                'Better response time for high-priority processes'
            ],
            cons: [
                'Can lead to priority inversion',
                'May cause starvation of low-priority processes',
                'Complex implementation'
            ]
        },
        'Preemptive Priority': {
            title: 'Preemptive Priority Scheduling',
            description: 'Preemptive version of priority scheduling where processes can be interrupted by higher priority processes.',
            pros: [
                'Better response time for high-priority processes',
                'More flexible than non-preemptive version',
                'Can handle real-time systems'
            ],
            cons: [
                'Can cause priority inversion',
                'Increased overhead due to preemption',
                'Complex implementation'
            ]
        }
    };

    // Generate explanation content
    const explanation = explanations[algorithm];
    if (explanation) {
        content.innerHTML = `
            <p class="mb-4">${explanation.description}</p>
            <div class="space-y-4">
                <div>
                    <h4 class="font-medium mb-2">Pros:</h4>
                    <ul class="list-disc list-inside space-y-1">
                        ${explanation.pros.map(pro => `<li>${pro}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Cons:</h4>
                    <ul class="list-disc list-inside space-y-1">
                        ${explanation.cons.map(con => `<li>${con}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    // Close modal when clicking the close button
    closeButton.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

// Event listener for step-by-step button
const stepByStepBtn = document.querySelector('.step-by-step-btn');
if (stepByStepBtn) {
    stepByStepBtn.addEventListener('click', function() {
        // Hide regular simulation button and show next step button
        const simulateBtn = document.querySelector('.simulate-btn');
        const nextStepBtn = document.querySelector('.next-step-btn');
        simulateBtn.classList.add('hidden');
        stepByStepBtn.classList.add('hidden');
        nextStepBtn.classList.remove('hidden');
        
        // Reset to first step
        scheduler.currentStep = 0;
        scheduler.nextStep();
    });
}

// Event listener for next step button
const nextStepBtn = document.querySelector('.next-step-btn');
if (nextStepBtn) {
    nextStepBtn.addEventListener('click', function() {
        scheduler.nextStep();
        
        // If we've reached the end, show regular simulation button again
        if (scheduler.currentStep >= scheduler.steps.length) {
            const simulateBtn = document.querySelector('.simulate-btn');
            const stepByStepBtn = document.querySelector('.step-by-step-btn');
            simulateBtn.classList.remove('hidden');
            nextStepBtn.classList.add('hidden');
            stepByStepBtn.classList.remove('hidden');
        }
    });
}

// Event listener for adding processes
addProcessBtn.addEventListener('click', function() {
    const id = processIdInput.value.trim();
    const arrivalTime = parseInt(arrivalTimeInput.value);
    const burstTime = parseInt(burstTimeInput.value);
    const priority = parseInt(priorityInput.value);

    // Validate inputs
    if (!id || !arrivalTimeInput.value || !burstTimeInput.value || !priorityInput.value) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please fill in all fields',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return;
    }

    // Validate process ID
    if (!/^[A-Za-z0-9]+$/.test(id)) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Process ID must contain only letters and numbers',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        processIdInput.classList.add('border-red-500');
        return;
    }
    processIdInput.classList.remove('border-red-500');

    // Validate arrival time
    if (isNaN(arrivalTime) || arrivalTime < 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Arrival time must be a non-negative number',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        arrivalTimeInput.classList.add('border-red-500');
        return;
    }
    arrivalTimeInput.classList.remove('border-red-500');

    // Validate burst time
    if (isNaN(burstTime) || burstTime <= 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Burst time must be a positive number',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        burstTimeInput.classList.add('border-red-500');
        return;
    }
    burstTimeInput.classList.remove('border-red-500');

    // Validate priority
    if (isNaN(priority) || priority < 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Priority must be a non-negative number',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        priorityInput.classList.add('border-red-500');
        return;
    }
    priorityInput.classList.remove('border-red-500');

    // Check for duplicate process ID
    const existingProcess = scheduler.processes.find(p => p.id === id);
    if (existingProcess) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Process ID already exists. Please use a different ID.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
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
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Process added successfully!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
});

// Event listener for simulation
simulateBtn.addEventListener('click', async function() {
    // Get selected algorithm and time quantum
    const algorithm = algorithmSelect.value;
    const timeQuantum = parseInt(timeQuantumInput.value) || 4;
    
    // Validate if an algorithm is selected
    if (!algorithm || algorithm === 'Select Algorithm') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please select a scheduling algorithm first',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return;
    }
    
    // Validate number of processes
    if (scheduler.processes.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please add at least one process',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
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
    
    // Disable simulate button during animation
    simulateBtn.disabled = true;
    simulateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    
    try {
        // Show initial loading state
        const originalText = simulateBtn.textContent;
        simulateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Simulating...';
        
        // Show countdown before showing Gantt chart (2 seconds total)
        for (let i = 2; i > 0; i--) {
            simulateBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Starting in ${i}s...`;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Show Gantt chart immediately after countdown
        await generateGanttChart(scheduler.processes, algorithm, timeQuantum);
        
        // Update button to show animation is starting
        simulateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Animation starting...';
        
        // Calculate and display metrics
        const metrics = scheduler.calculateMetrics();
        scheduler.updateMetricsDisplay(metrics);
        
        // Scroll to Gantt chart section after a short delay
        setTimeout(() => {
            const ganttSection = document.getElementById('gantt-chart-section');
            if (ganttSection) {
                ganttSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
        
    } catch (error) {
        console.error('Error during simulation:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred during simulation',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    } finally {
        // Re-enable button and restore text
        simulateBtn.disabled = false;
        simulateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        simulateBtn.textContent = 'Simulate';
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
