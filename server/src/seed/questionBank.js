import { Question } from "../models/index.js";

/**
 * Starter question banks, keyed by subject code. Each bank holds at most
 * ten questions and is only used to fill a subject that has no questions
 * yet, so it never adds to or overwrites a teacher's own bank.
 */
export const MAX_QUESTIONS_PER_SUBJECT = 10;

const MARKS_BY_DIFFICULTY = { easy: 1, medium: 2, hard: 3 };

const TRUE_FALSE = [
  { key: "A", text: "True" },
  { key: "B", text: "False" },
];

const options = (...texts) =>
  texts.map((text, index) => ({ key: "ABCDEF"[index], text }));

export const SUBJECT_QUESTION_BANKS = {
  // Data Structures & Algorithms
  CS201: [
    {
      topic: "Complexity Analysis",
      type: "single",
      difficulty: "easy",
      text: "What is the worst-case time complexity of binary search on a sorted array of n elements?",
      options: options("O(1)", "O(log n)", "O(n)", "O(n log n)"),
      correctKeys: ["B"],
      explanation:
        "Each comparison halves the remaining search range, so at most about log2(n) comparisons are needed.",
    },
    {
      topic: "Stacks & Queues",
      type: "truefalse",
      difficulty: "easy",
      text: "A stack removes elements in first-in, first-out (FIFO) order.",
      options: TRUE_FALSE,
      correctKeys: ["B"],
      explanation:
        "A stack is last-in, first-out (LIFO). First-in, first-out is the behaviour of a queue.",
    },
    {
      topic: "Stacks & Queues",
      type: "single",
      difficulty: "easy",
      text: "Which data structure is used to hold the frontier in a breadth-first search of a graph?",
      options: options("Stack", "Queue", "Binary heap", "Hash table"),
      correctKeys: ["B"],
      explanation:
        "Breadth-first search visits vertices in the order they were discovered, which a queue provides. A stack gives depth-first order.",
    },
    {
      topic: "Sorting",
      type: "single",
      difficulty: "medium",
      text: "Which of these sorting algorithms runs in O(n log n) time even in the worst case?",
      options: options(
        "Quick sort",
        "Merge sort",
        "Bubble sort",
        "Insertion sort",
      ),
      correctKeys: ["B"],
      explanation:
        "Merge sort always splits the input in half and merges in linear time. Quick sort degrades to O(n^2) on bad pivots; bubble and insertion sort are O(n^2).",
    },
    {
      topic: "Sorting",
      type: "multiple",
      difficulty: "medium",
      text: "Which of the following sorting algorithms are stable in their standard implementations?",
      options: options(
        "Merge sort",
        "Insertion sort",
        "Heap sort",
        "Bubble sort",
      ),
      correctKeys: ["A", "B", "D"],
      explanation:
        "Merge, insertion and bubble sort keep equal keys in their original relative order. Heap sort moves elements across the heap and does not.",
    },
    {
      topic: "Trees",
      type: "single",
      difficulty: "medium",
      text: "An in-order traversal of a binary search tree visits the keys in which order?",
      options: options(
        "Ascending order",
        "Descending order",
        "Level by level",
        "The order in which they were inserted",
      ),
      correctKeys: ["A"],
      explanation:
        "In-order visits the left subtree, then the node, then the right subtree. In a binary search tree that yields the keys in ascending order.",
    },
    {
      topic: "Trees",
      type: "truefalse",
      difficulty: "easy",
      text: "A tree with n vertices always has exactly n - 1 edges.",
      options: TRUE_FALSE,
      correctKeys: ["A"],
      explanation:
        "A tree is connected and has no cycles; every vertex except the root has exactly one edge to its parent, giving n - 1 edges.",
    },
    {
      topic: "Hashing",
      type: "single",
      difficulty: "medium",
      text: "With a good hash function and a low load factor, what is the average-case time to look up a key in a hash table?",
      options: options("O(1)", "O(log n)", "O(n)", "O(n log n)"),
      correctKeys: ["A"],
      explanation:
        "Keys are spread evenly across buckets, so a lookup inspects a constant number of entries on average. The worst case is O(n) when many keys collide.",
    },
    {
      topic: "Graphs",
      type: "single",
      difficulty: "hard",
      text: "Dijkstra's shortest-path algorithm can return incorrect distances when the graph contains which of the following?",
      options: options(
        "Cycles",
        "Negative edge weights",
        "Vertices unreachable from the source",
        "More edges than vertices",
      ),
      correctKeys: ["B"],
      explanation:
        "Dijkstra finalises a vertex once it is the closest unvisited one, which assumes later edges cannot shorten the path. A negative edge breaks that assumption; Bellman-Ford handles it.",
    },
    {
      topic: "Dynamic Programming",
      type: "multiple",
      difficulty: "hard",
      text: "Which properties must a problem have for dynamic programming to give an efficient, correct solution?",
      options: options(
        "Optimal substructure",
        "Overlapping subproblems",
        "The greedy-choice property",
        "Input that is already sorted",
      ),
      correctKeys: ["A", "B"],
      explanation:
        "Dynamic programming builds an optimal answer from optimal answers to subproblems (optimal substructure) and saves work because those subproblems repeat (overlapping subproblems).",
    },
  ],

  // Operating Systems
  CS302: [
    {
      topic: "Processes & Threads",
      type: "single",
      difficulty: "easy",
      text: "Which state does a process move to while it waits for an I/O operation to complete?",
      options: options("Ready", "Running", "Waiting (blocked)", "Terminated"),
      correctKeys: ["C"],
      explanation:
        "A process that cannot continue until an event such as I/O completion occurs is placed in the waiting (blocked) state, then returns to ready.",
    },
    {
      topic: "Processes & Threads",
      type: "truefalse",
      difficulty: "easy",
      text: "Threads belonging to the same process share that process's code and heap memory.",
      options: TRUE_FALSE,
      correctKeys: ["A"],
      explanation:
        "Threads of one process share its address space, including code, global data and heap. Each thread has its own stack and register state.",
    },
    {
      topic: "Processes & Threads",
      type: "multiple",
      difficulty: "medium",
      text: "Which of the following are stored in a process control block (PCB)?",
      options: options(
        "Process state",
        "Program counter",
        "Saved CPU registers",
        "The program's source code",
      ),
      correctKeys: ["A", "B", "C"],
      explanation:
        "The PCB holds what the kernel needs to suspend and resume a process: its state, program counter, registers, scheduling and memory information. Source code is not part of it.",
    },
    {
      topic: "CPU Scheduling",
      type: "single",
      difficulty: "medium",
      text: "For a set of processes that all arrive at the same time, which scheduling algorithm gives the minimum average waiting time?",
      options: options(
        "First-Come, First-Served",
        "Shortest Job First",
        "Round Robin",
        "Last-Come, First-Served",
      ),
      correctKeys: ["B"],
      explanation:
        "Running the shortest jobs first makes the fewest processes wait behind long ones, which is provably optimal for average waiting time.",
    },
    {
      topic: "CPU Scheduling",
      type: "single",
      difficulty: "medium",
      text: "If the time quantum in Round Robin scheduling is made very large, the algorithm behaves like which of the following?",
      options: options(
        "First-Come, First-Served",
        "Shortest Job First",
        "Shortest Remaining Time First",
        "Priority scheduling",
      ),
      correctKeys: ["A"],
      explanation:
        "With a quantum longer than every CPU burst, no process is ever preempted, so they simply run in arrival order.",
    },
    {
      topic: "Synchronization",
      type: "single",
      difficulty: "medium",
      text: "A semaphore whose value can only be 0 or 1 is called a:",
      options: options(
        "Binary semaphore",
        "Counting semaphore",
        "Monitor",
        "Condition variable",
      ),
      correctKeys: ["A"],
      explanation:
        "A binary semaphore has two values and is commonly used to guard a critical section. A counting semaphore can take any non-negative value.",
    },
    {
      topic: "Synchronization",
      type: "truefalse",
      difficulty: "medium",
      text: "A race condition can occur only on a machine with more than one CPU core.",
      options: TRUE_FALSE,
      correctKeys: ["B"],
      explanation:
        "On a single core the scheduler can still preempt a thread in the middle of an update and run another, so shared data can be corrupted there too.",
    },
    {
      topic: "Deadlocks",
      type: "multiple",
      difficulty: "hard",
      text: "Which of the following are among the four necessary conditions for a deadlock?",
      options: options(
        "Mutual exclusion",
        "Hold and wait",
        "Preemption of resources",
        "Circular wait",
      ),
      correctKeys: ["A", "B", "D"],
      explanation:
        "The four conditions are mutual exclusion, hold and wait, no preemption, and circular wait. Being able to preempt resources prevents deadlock rather than causing it.",
    },
    {
      topic: "Memory Management",
      type: "single",
      difficulty: "hard",
      text: "Which page replacement algorithm can suffer from Belady's anomaly, where adding frames increases page faults?",
      options: options(
        "First-In, First-Out (FIFO)",
        "Least Recently Used (LRU)",
        "Optimal (OPT)",
      ),
      correctKeys: ["A"],
      explanation:
        "FIFO is not a stack algorithm, so the pages held with more frames are not always a superset of those held with fewer. LRU and OPT are stack algorithms and cannot show the anomaly.",
    },
    {
      topic: "Memory Management",
      type: "single",
      difficulty: "easy",
      text: "What is thrashing in a virtual memory system?",
      options: options(
        "The system spends more time swapping pages than running processes",
        "The CPU overheats because of sustained heavy load",
        "Two processes wait forever for each other's resources",
        "The disk becomes fragmented after many file deletions",
      ),
      correctKeys: ["A"],
      explanation:
        "When processes do not have enough frames for their working sets, page faults become so frequent that the system does little useful work.",
    },
  ],

  // Computer Networks
  CS303: [
    {
      topic: "OSI Model",
      type: "single",
      difficulty: "easy",
      text: "How many layers does the OSI reference model define?",
      options: options("4", "5", "7", "9"),
      correctKeys: ["C"],
      explanation:
        "The seven layers are physical, data link, network, transport, session, presentation and application.",
    },
    {
      topic: "OSI Model",
      type: "single",
      difficulty: "easy",
      text: "Which OSI layer is responsible for routing packets between different networks?",
      options: options(
        "Data link layer",
        "Network layer",
        "Transport layer",
        "Session layer",
      ),
      correctKeys: ["B"],
      explanation:
        "The network layer handles logical addressing and chooses the path a packet takes across networks. IP operates at this layer.",
    },
    {
      topic: "Transport Layer",
      type: "truefalse",
      difficulty: "easy",
      text: "UDP guarantees that datagrams are delivered reliably and in the order they were sent.",
      options: TRUE_FALSE,
      correctKeys: ["B"],
      explanation:
        "UDP is connectionless and best-effort: datagrams may be lost, duplicated or reordered. Reliability and ordering are provided by TCP.",
    },
    {
      topic: "Transport Layer",
      type: "single",
      difficulty: "medium",
      text: "How many segments are exchanged to establish a TCP connection?",
      options: options("1", "2", "3", "4"),
      correctKeys: ["C"],
      explanation:
        "The three-way handshake is SYN, SYN-ACK, then ACK. Closing a connection normally takes four segments.",
    },
    {
      topic: "Transport Layer",
      type: "multiple",
      difficulty: "medium",
      text: "Which of the following does TCP provide that UDP does not?",
      options: options(
        "Flow control",
        "Congestion control",
        "Port numbers for multiplexing",
        "Retransmission of lost segments",
      ),
      correctKeys: ["A", "B", "D"],
      explanation:
        "TCP adds flow control, congestion control and retransmission on top of delivery. Both TCP and UDP use port numbers to identify applications.",
    },
    {
      topic: "IP Addressing",
      type: "single",
      difficulty: "medium",
      text: "How many usable host addresses are there in a /24 IPv4 subnet?",
      options: options("128", "254", "255", "256"),
      correctKeys: ["B"],
      explanation:
        "A /24 leaves 8 host bits, giving 256 addresses. The network address and the broadcast address cannot be assigned to hosts, leaving 254.",
    },
    {
      topic: "IP Addressing",
      type: "truefalse",
      difficulty: "medium",
      text: "An IPv6 address is 128 bits long.",
      options: TRUE_FALSE,
      correctKeys: ["A"],
      explanation:
        "IPv6 addresses are 128 bits, written as eight groups of four hexadecimal digits. IPv4 addresses are 32 bits.",
    },
    {
      topic: "DNS",
      type: "single",
      difficulty: "easy",
      text: "What is the main job of the Domain Name System (DNS)?",
      options: options(
        "Translating domain names into IP addresses",
        "Assigning IP addresses to hosts automatically",
        "Encrypting traffic between a browser and a server",
        "Finding the MAC address for a known IP address",
      ),
      correctKeys: ["A"],
      explanation:
        "DNS resolves names such as example.com to IP addresses. Automatic address assignment is DHCP, encryption is TLS, and MAC lookup is ARP.",
    },
    {
      topic: "Routing & Switching",
      type: "single",
      difficulty: "medium",
      text: "Which device forwards frames using the destination MAC address?",
      options: options("Hub", "Switch", "Router", "Repeater"),
      correctKeys: ["B"],
      explanation:
        "A switch works at the data link layer and learns which MAC addresses are reachable on each port. A router forwards packets using IP addresses.",
    },
    {
      topic: "Routing & Switching",
      type: "single",
      difficulty: "hard",
      text: "Which of these is a link-state routing protocol that computes routes with Dijkstra's shortest-path algorithm?",
      options: options("RIP", "OSPF", "BGP", "EIGRP"),
      correctKeys: ["B"],
      explanation:
        "OSPF routers flood link-state information and each runs Dijkstra's algorithm over the resulting map. RIP is distance-vector, BGP is path-vector, and EIGRP is an advanced distance-vector protocol.",
    },
  ],
};

/**
 * Fills every subject that currently has no questions from its starter bank,
 * owned by `owner`. Subjects that already have questions, and subjects with
 * no starter bank, are left untouched.
 *
 * @returns {Promise<Array<{ code: string, added: number, reason?: string }>>}
 */
export async function seedEmptySubjectBanks({ subjects, owner }) {
  const report = [];

  for (const subject of subjects) {
    if (await Question.exists({ subjectId: subject._id })) {
      report.push({
        code: subject.code,
        added: 0,
        reason: "already has questions",
      });
      continue;
    }
    const bank = SUBJECT_QUESTION_BANKS[subject.code];
    if (!bank) {
      report.push({ code: subject.code, added: 0, reason: "no starter bank" });
      continue;
    }

    const created = await Question.create(
      bank.slice(0, MAX_QUESTIONS_PER_SUBJECT).map((question) => ({
        ...question,
        subjectId: subject._id,
        defaultMarks: MARKS_BY_DIFFICULTY[question.difficulty],
        createdBy: owner._id,
      })),
    );
    report.push({ code: subject.code, added: created.length });
  }

  return report;
}
