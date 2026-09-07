USE adaptive_skill_assessment;

INSERT INTO Users (name, email, password_hash, role) VALUES
('Admin User', 'admin@adaptive.com', '$2b$10$adminplaceholderhashvalue', 'ADMIN'),
('Student Demo', 'student@adaptive.com', '$2b$10$studentplaceholderhashvalue', 'STUDENT');

INSERT INTO Subjects (subject_name, description) VALUES
('Java', 'Core Java assessment topics for programming fundamentals and advanced concepts.'),
('DBMS & SQL', 'Database management system and SQL query assessment topics.'),
('DSA', 'Data structures and algorithms assessment topics.');

INSERT INTO Topics (subject_id, topic_name, description) VALUES
(1, 'OOP', 'Classes, objects, inheritance, polymorphism, abstraction and encapsulation.'),
(1, 'Arrays', 'One-dimensional and multi-dimensional array concepts and operations.'),
(1, 'Strings', 'String handling, immutability and string utility methods.'),
(1, 'Collections', 'List, Set, Map and common collection framework operations.'),
(1, 'Exception Handling', 'try-catch, throws, throw, finally and custom exceptions.'),
(1, 'Multithreading', 'Thread lifecycle, synchronization and concurrency basics.'),
(1, 'File Handling', 'File I/O streams, readers, writers and file operations.'),
(1, 'JDBC', 'Database connectivity using Java Database Connectivity.'),
(2, 'DBMS Basics', 'Fundamental DBMS concepts and architecture.'),
(2, 'Keys', 'Primary, foreign, candidate and super keys.'),
(2, 'Normalization', '1NF, 2NF, 3NF and normalization goals.'),
(2, 'SQL', 'Basic SQL commands and syntax.'),
(2, 'Queries', 'Filtering, grouping and aggregation queries.'),
(2, 'Joins', 'Inner, left, right and full join concepts.'),
(2, 'Transactions', 'Commit, rollback and transaction control statements.'),
(2, 'ACID', 'Atomicity, consistency, isolation and durability.'),
(3, 'Arrays', 'Array traversals and basic problem solving.'),
(3, 'Strings', 'String manipulation and pattern problems.'),
(3, 'Linked Lists', 'Singly and doubly linked list operations.'),
(3, 'Stacks', 'LIFO operations and applications.'),
(3, 'Queues', 'FIFO operations and applications.'),
(3, 'Trees', 'Binary trees, traversals and tree properties.'),
(3, 'Searching', 'Linear and binary search approaches.'),
(3, 'Sorting', 'Common sorting algorithms and complexity.');

INSERT INTO Questions (subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by) VALUES
(1, 1, 'Which OOP concept allows a child class to provide a specific implementation of a method already defined in the parent class?', 'Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction', 'C', 'EASY', 'Method overriding is a runtime polymorphism feature.', 1),
(1, 2, 'What is the default value of an int element in a newly created Java array?', '0', 'null', '1', '-1', 'A', 'EASY', 'Primitive int arrays are initialized with 0 by default.', 1),
(1, 3, 'Which class in Java is immutable?', 'StringBuilder', 'StringBuffer', 'String', 'CharBuffer', 'C', 'EASY', 'String objects cannot be modified after creation.', 1),
(1, 4, 'Which Java collection does not allow duplicate elements?', 'ArrayList', 'LinkedList', 'HashSet', 'Vector', 'C', 'EASY', 'Set implementations do not allow duplicate values.', 1),
(1, 5, 'Which block always executes whether an exception occurs or not?', 'catch', 'throw', 'finally', 'throws', 'C', 'EASY', 'The finally block is designed for cleanup logic.', 1),
(1, 6, 'Which method is used to start a thread in Java?', 'run()', 'start()', 'execute()', 'init()', 'B', 'EASY', 'Calling start creates a new thread and invokes run internally.', 1),
(1, 7, 'Which package contains FileReader in Java?', 'java.io', 'java.util', 'java.lang', 'java.sql', 'A', 'MEDIUM', 'FileReader belongs to the java.io package.', 1),
(1, 8, 'Which JDBC interface is used to execute a precompiled SQL statement?', 'Statement', 'PreparedStatement', 'CallableStatement', 'ResultSet', 'B', 'MEDIUM', 'PreparedStatement is precompiled and safer for parameterized queries.', 1),
(1, 1, 'Which of these Java features allows methods with the same name but different parameter lists?', 'Overriding', 'Overloading', 'Inheritance', 'Abstraction', 'B', 'MEDIUM', 'Method overloading is determined at compile-time by parameter signature.', 1),
(1, 2, 'Given int[] a = new int[5]; what does Arrays.fill(a, 2, 4, 9) result in?', 'Indices 2,3,4 set to 9', 'Indices 2,3 set to 9', 'Indices 0..2 set to 9', 'All 5 elements set to 9', 'B', 'MEDIUM', 'Arrays.fill(fromIndex, toIndex) uses an exclusive upper bound.', 1),
(1, 3, 'What is the output of "abc".substring(1, 3)?', '"ab"', '"bc"', '"b"', '"c"', 'B', 'MEDIUM', 'substring begin inclusive, end exclusive -> chars at 1 and 2.', 1),
(1, 4, 'Which Java collection maintains insertion order and allows null elements?', 'HashSet', 'TreeSet', 'LinkedHashSet', 'EnumSet', 'C', 'HARD', 'LinkedHashSet preserves insertion order; HashSet does not guarantee it.', 1),
(1, 5, 'What will the code `try { throw new IOException(); } catch (Exception e) {} finally { throw new RuntimeException(); }` do?', 'Compilation error', 'RuntimeException propagates and IOException is suppressed', 'IOException propagates', 'No exception propagates', 'B', 'HARD', 'A finally-block throw suppresses any prior exception.', 1),
(1, 6, 'Which statement correctly distinguishes CountDownLatch from CyclicBarrier?', 'CyclicBarrier can be reset; CountDownLatch cannot', 'CountDownLatch supports barrier actions', 'Both reset automatically after reaching zero', 'CyclicBarrier has countDown() and await()', 'A', 'HARD', 'CyclicBarrier is reusable, CountDownLatch.countDown() is one-shot.', 1),
(2, 9, 'What does DBMS stand for?', 'Data Backup Management System', 'Database Management System', 'Digital Base Management System', 'Database Mapping System', 'B', 'EASY', 'DBMS expands to Database Management System.', 1),
(2, 10, 'Which key uniquely identifies each row in a table?', 'Foreign Key', 'Composite Key', 'Primary Key', 'Super Key', 'C', 'EASY', 'A primary key uniquely identifies every record.', 1),
(2, 11, 'Normalization is mainly used to reduce what?', 'Execution time', 'Data redundancy', 'Index count', 'Query syntax', 'B', 'MEDIUM', 'Normalization reduces redundancy and improves consistency.', 1),
(2, 12, 'Which SQL command is used to retrieve data from a table?', 'GET', 'SELECT', 'FETCH', 'SHOW', 'B', 'EASY', 'SELECT is the standard SQL retrieval command.', 1),
(2, 13, 'Which clause is used to filter grouped records?', 'WHERE', 'ORDER BY', 'HAVING', 'GROUP FILTER', 'C', 'MEDIUM', 'HAVING filters records after GROUP BY is applied.', 1),
(2, 14, 'Which join returns matching rows from both tables only?', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'C', 'EASY', 'INNER JOIN returns only matching rows.', 1),
(2, 15, 'Which command permanently saves a transaction?', 'ROLLBACK', 'SAVEPOINT', 'COMMIT', 'LOCK', 'C', 'EASY', 'COMMIT makes transaction changes permanent.', 1),
(2, 16, 'In ACID properties, which property ensures completed transactions remain saved even after a system failure?', 'Atomicity', 'Consistency', 'Isolation', 'Durability', 'D', 'MEDIUM', 'Durability guarantees persistence after commit.', 1),
(2, 9, 'Which of these is a type of DBMS data model?', 'Relational model', 'Client-server model', 'Peer-to-peer model', 'Layered model', 'A', 'EASY', 'The relational model organizes data into tables with rows and columns.', 1),
(2, 10, 'A table with columns (order_id, product_id) used to link Orders and Products is an example of a?', 'Weak table', 'Bridge/join table', 'Materialized view', 'Temporary table', 'B', 'MEDIUM', 'A bridge (join/link) table resolves many-to-many relationships.', 1),
(2, 11, 'A table with no transitive dependencies and all non-key columns depend only on the whole primary key satisfies?', '1NF', '2NF only', '3NF', 'BCNF', 'C', 'HARD', '3NF eliminates transitive functional dependencies.', 1),
(2, 12, 'Which SQL operator is used to pattern-match characters using wildcards?', 'REGEXP_MATCH', 'LIKE', 'IN', 'BETWEEN', 'B', 'EASY', 'LIKE uses % and _ for wildcard matching.', 1),
(2, 13, 'SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 5 filters?', 'Before grouping, rows with count > 5', 'After grouping, groups with count > 5', 'Both before and after grouping', 'Invalid syntax', 'B', 'MEDIUM', 'HAVING filters groups after GROUP BY aggregation.', 1),
(2, 14, 'Which join returns all rows from the left table even when no match exists on the right?', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN', 'B', 'EASY', 'LEFT JOIN preserves all left rows and fills right with NULLs.', 1),
(2, 15, 'In MySQL, which isolation level prevents dirty reads but allows non-repeatable reads?', 'READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE', 'B', 'HARD', 'READ COMMITTED: new snapshot per statement so reads can differ within a tx.', 1),
(2, 16, 'During power failure mid-transaction, which ACID property guarantees the database reverts to a prior consistent state?', 'Atomicity', 'Consistency', 'Isolation', 'Durability', 'A', 'MEDIUM', 'Atomicity guarantees all-or-nothing, including rollback after crash.', 1),
(3, 17, 'What is the time complexity of accessing an element by index in an array?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'A', 'EASY', 'Array indexing is constant time.', 1),
(3, 18, 'Which technique is commonly used to reverse a string in place-like logic during interviews?', 'Greedy', 'Two pointers', 'Backtracking', 'Hashing', 'B', 'EASY', 'Two pointers swap characters from both ends.', 1),
(3, 19, 'Which linked list traversal starts from the head and follows next references until null?', 'Breadth-first traversal', 'Depth-first traversal', 'Sequential traversal', 'Binary traversal', 'C', 'EASY', 'Linked lists are commonly traversed sequentially from head to null.', 1),
(3, 20, 'Which data structure is used for function call management in recursion?', 'Queue', 'Stack', 'Heap', 'Graph', 'B', 'EASY', 'Recursion uses the call stack.', 1),
(3, 21, 'Which operation removes an element from the front in a queue?', 'push', 'pop', 'dequeue', 'peek', 'C', 'EASY', 'Queues remove elements using dequeue.', 1),
(3, 22, 'Which traversal of a binary search tree gives values in sorted order?', 'Preorder', 'Inorder', 'Postorder', 'Level order', 'B', 'MEDIUM', 'Inorder traversal of a BST visits values in sorted order.', 1),
(3, 23, 'Which searching algorithm requires the array to be sorted?', 'Linear Search', 'Binary Search', 'Depth-First Search', 'Hash Search', 'B', 'EASY', 'Binary search works only on sorted data.', 1),
(3, 24, 'Which sorting algorithm repeatedly compares adjacent elements and swaps them if they are in the wrong order?', 'Merge Sort', 'Selection Sort', 'Bubble Sort', 'Quick Sort', 'C', 'EASY', 'Bubble sort uses repeated adjacent swaps.', 1),
(3, 17, 'Inserting an element at the END of a dynamic array (ArrayList) has amortized time complexity?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'A', 'MEDIUM', 'Amortized O(1) due to geometric resizing; occasional O(n) copy averages out.', 1),
(3, 18, 'Given a string of length n, the longest palindromic substring using expand-around-centers runs in?', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(n^3)', 'C', 'HARD', 'Expand-around-centers tries O(n) centers with O(n) expansion each.', 1),
(3, 19, 'To detect a cycle in a singly linked list in O(n) time and O(1) extra space, you use?', 'Hash set visited nodes', 'Floyd\'s Tortoise and Hare', 'Recursive DFS with parent', 'Reverse and compare', 'B', 'MEDIUM', 'Floyd\'s two-pointer algorithm detects cycles in linear time and constant space.', 1),
(3, 20, 'What is the minimum number of stacks required to implement a queue efficiently?', '1', '2', '3', '4', 'B', 'MEDIUM', 'One stack for enqueue, second to reverse ordering on dequeue.', 1),
(3, 21, 'Which data structure is the basis for a priority queue that supports O(log n) insert and extract-min?', 'Binary heap', 'Balanced BST', 'Linked list', 'Hash map', 'A', 'EASY', 'Binary heaps provide log-time insert and extract-min.', 1),
(3, 22, 'A complete binary tree with n nodes has height?', 'floor(log2 n)', 'ceil(log2 (n+1)) - 1', 'n - 1', '2*n + 1', 'B', 'HARD', 'Height of a complete binary tree (root at 0) is floor(log2 n) or equivalently ceil(log2(n+1)) - 1.', 1),
(3, 23, 'Binary search on an array of size n makes at most how many comparisons?', 'n', 'floor(log2 n) + 1', 'n/2', 'sqrt(n)', 'B', 'MEDIUM', 'Binary search halves the space each iteration.', 1),
(3, 24, 'Which comparison-based sort has the best possible worst-case time complexity?', 'Bubble Sort O(n^2)', 'Merge Sort O(n log n)', 'Quick Sort O(n^2) worst', 'Insertion Sort O(n^2)', 'B', 'MEDIUM', 'Merge Sort guarantees O(n log n) worst case.', 1);

INSERT INTO Assessments (user_id, subject_id, started_at, submitted_at, status, total_questions, score, percentage, assessment_level) VALUES
(2, 1, '2026-09-01 10:00:00', '2026-09-01 10:20:00', 'COMPLETED', 4, 2, 50.00, 'INTERMEDIATE'),
(2, 2, '2026-09-02 11:00:00', '2026-09-02 11:18:00', 'COMPLETED', 4, 3, 75.00, 'INTERMEDIATE'),
(2, 3, '2026-09-03 12:00:00', '2026-09-03 12:15:00', 'COMPLETED', 4, 1, 25.00, 'BEGINNER');

INSERT INTO UserAnswers (assessment_id, question_id, selected_option, is_correct, time_taken_seconds) VALUES
(1, 1, 'C', TRUE, 30),
(1, 4, 'C', TRUE, 28),
(1, 6, 'A', FALSE, 35),
(1, 8, 'A', FALSE, 42),
(2, 9, 'B', TRUE, 20),
(2, 10, 'C', TRUE, 24),
(2, 14, 'C', TRUE, 32),
(2, 16, 'A', FALSE, 38),
(3, 17, 'C', FALSE, 22),
(3, 20, 'B', TRUE, 18),
(3, 22, 'A', FALSE, 40),
(3, 24, 'B', FALSE, 27);

INSERT INTO TopicPerformance (assessment_id, topic_id, correct_count, wrong_count, percentage, performance_level) VALUES
(1, 1, 1, 0, 100.00, 'STRONG'),
(1, 4, 1, 0, 100.00, 'STRONG'),
(1, 6, 0, 1, 0.00, 'WEAK'),
(1, 8, 0, 1, 0.00, 'WEAK'),
(2, 9, 1, 0, 100.00, 'STRONG'),
(2, 10, 1, 0, 100.00, 'STRONG'),
(2, 14, 1, 0, 100.00, 'STRONG'),
(2, 16, 0, 1, 0.00, 'WEAK'),
(3, 17, 0, 1, 0.00, 'WEAK'),
(3, 20, 1, 0, 100.00, 'STRONG'),
(3, 22, 0, 1, 0.00, 'WEAK'),
(3, 24, 0, 1, 0.00, 'WEAK');

INSERT INTO Recommendations (assessment_id, user_id, topic_id, recommendation_text, priority_level) VALUES
(1, 2, 6, 'Practice Java thread lifecycle, synchronization, and creating threads with Runnable.', 'HIGH'),
(1, 2, 8, 'Revise JDBC connection flow, PreparedStatement usage, and ResultSet handling.', 'HIGH'),
(2, 2, 16, 'Review ACID properties with transaction examples and failure recovery scenarios.', 'MEDIUM'),
(3, 2, 17, 'Strengthen array basics with indexing, traversal, and common interview problems.', 'HIGH'),
(3, 2, 22, 'Practice binary tree traversals and understand when inorder, preorder, and postorder are used.', 'HIGH'),
(3, 2, 24, 'Compare Bubble Sort with Selection Sort and Insertion Sort using small examples.', 'MEDIUM');
