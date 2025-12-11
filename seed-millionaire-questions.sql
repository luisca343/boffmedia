-- Who Wants to Be a Millionaire? - Sample Questions
-- Prize structure (US version): $100, $200, $300, $500, $1000, $2000, $4000, $8000, $16000, $32000, $64000, $125000, $250000, $500000, $1000000

-- Level 1 Questions ($100)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What color is the sky on a clear day?', '["Green", "Blue", "Red", "Yellow"]', 1, 1, 100.00, 'General Knowledge'),
('How many legs does a spider have?', '["Six", "Eight", "Ten", "Twelve"]', 1, 1, 100.00, 'Science'),
('What is 2 + 2?', '["3", "4", "5", "6"]', 1, 1, 100.00, 'Mathematics');

-- Level 2 Questions ($200)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('Which planet is known as the Red Planet?', '["Venus", "Mars", "Jupiter", "Saturn"]', 1, 2, 200.00, 'Science'),
('How many days are in a leap year?', '["364", "365", "366", "367"]', 2, 2, 200.00, 'General Knowledge'),
('What is the capital of France?', '["London", "Berlin", "Paris", "Madrid"]', 2, 2, 200.00, 'Geography');

-- Level 3 Questions ($300)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('Who painted the Mona Lisa?', '["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"]', 1, 3, 300.00, 'Art'),
('What is the largest ocean on Earth?', '["Atlantic", "Pacific", "Indian", "Arctic"]', 1, 3, 300.00, 'Geography'),
('In what year did World War II end?', '["1943", "1944", "1945", "1946"]', 2, 3, 300.00, 'History');

-- Level 4 Questions ($500)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the chemical symbol for gold?', '["Go", "Au", "Gd", "Ag"]', 1, 4, 500.00, 'Science'),
('Who wrote "Romeo and Juliet"?', '["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"]', 1, 4, 500.00, 'Literature'),
('How many continents are there?', '["Five", "Six", "Seven", "Eight"]', 2, 4, 500.00, 'Geography');

-- Level 5 Questions ($1,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the smallest country in the world?', '["Monaco", "Vatican City", "San Marino", "Liechtenstein"]', 1, 5, 1000.00, 'Geography'),
('Which element has the atomic number 1?', '["Helium", "Hydrogen", "Oxygen", "Carbon"]', 1, 5, 1000.00, 'Science'),
('Who discovered penicillin?', '["Louis Pasteur", "Alexander Fleming", "Marie Curie", "Isaac Newton"]', 1, 5, 1000.00, 'History');

-- Level 6 Questions ($2,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the capital of Australia?', '["Sydney", "Canberra", "Melbourne", "Brisbane"]', 1, 6, 2000.00, 'Geography'),
('In which year did the Titanic sink?', '["1910", "1912", "1914", "1916"]', 1, 6, 2000.00, 'History'),
('What is the square root of 144?', '["10", "12", "14", "16"]', 1, 6, 2000.00, 'Mathematics');

-- Level 7 Questions ($4,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('Which Shakespeare play features the character of Prospero?', '["Hamlet", "The Tempest", "Macbeth", "Othello"]', 1, 7, 4000.00, 'Literature'),
('What is the longest river in the world?', '["Amazon", "Nile", "Yangtze", "Mississippi"]', 1, 7, 4000.00, 'Geography'),
('Who was the first person to walk on the moon?', '["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "Michael Collins"]', 1, 7, 4000.00, 'History');

-- Level 8 Questions ($8,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the speed of light in a vacuum?', '["299,792 km/s", "300,000 km/s", "299,792,458 m/s", "Both A and C"]', 3, 8, 8000.00, 'Science'),
('Which Mozart opera features the Queen of the Night?', '["Don Giovanni", "The Magic Flute", "Cosi fan tutte", "The Marriage of Figaro"]', 1, 8, 8000.00, 'Music'),
('In what year did the Berlin Wall fall?', '["1987", "1988", "1989", "1990"]', 2, 8, 8000.00, 'History');

-- Level 9 Questions ($16,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the rarest blood type?', '["O negative", "AB negative", "B negative", "A negative"]', 1, 9, 16000.00, 'Science'),
('Which ancient wonder is still standing today?', '["Colossus of Rhodes", "Great Pyramid of Giza", "Hanging Gardens", "Lighthouse of Alexandria"]', 1, 9, 16000.00, 'History'),
('What does "HTTP" stand for?', '["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transport Protocol", "High Text Transfer Process"]', 0, 9, 16000.00, 'Technology');

-- Level 10 Questions ($32,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('Which planet has the most moons?', '["Jupiter", "Saturn", "Uranus", "Neptune"]', 1, 10, 32000.00, 'Science'),
('Who wrote "One Hundred Years of Solitude"?', '["Jorge Luis Borges", "Gabriel García Márquez", "Pablo Neruda", "Octavio Paz"]', 1, 10, 32000.00, 'Literature'),
('In what year was the first iPhone released?', '["2005", "2006", "2007", "2008"]', 2, 10, 32000.00, 'Technology');

-- Level 11 Questions ($64,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the only letter that doesn''t appear in any US state name?', '["Q", "Z", "X", "J"]', 0, 11, 64000.00, 'Geography'),
('Which element has the highest melting point?', '["Tungsten", "Carbon", "Osmium", "Rhenium"]', 1, 11, 64000.00, 'Science'),
('Who composed the opera "La Traviata"?', '["Puccini", "Verdi", "Rossini", "Donizetti"]', 1, 11, 64000.00, 'Music');

-- Level 12 Questions ($125,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the capital of Burkina Faso?', '["Ouagadougou", "Bamako", "Niamey", "N''Djamena"]', 0, 12, 125000.00, 'Geography'),
('In quantum mechanics, what is Schrödinger''s equation used to describe?', '["Particle velocity", "Wave function", "Energy levels", "Spin states"]', 1, 12, 125000.00, 'Science'),
('Who wrote "The Brothers Karamazov"?', '["Leo Tolstoy", "Fyodor Dostoevsky", "Anton Chekhov", "Ivan Turgenev"]', 1, 12, 125000.00, 'Literature');

-- Level 13 Questions ($250,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the Mohs hardness of a diamond?', '["8", "9", "10", "11"]', 2, 13, 250000.00, 'Science'),
('Which Byzantine emperor reconquered much of the Western Roman Empire?', '["Constantine", "Justinian I", "Heraclius", "Basil II"]', 1, 13, 250000.00, 'History'),
('What is the rarest naturally occurring element on Earth?', '["Francium", "Astatine", "Plutonium", "Technetium"]', 1, 13, 250000.00, 'Science');

-- Level 14 Questions ($500,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('In which year did the Meiji Restoration begin in Japan?', '["1866", "1867", "1868", "1869"]', 2, 14, 500000.00, 'History'),
('What is the largest desert in Asia?', '["Thar Desert", "Gobi Desert", "Karakum Desert", "Arabian Desert"]', 1, 14, 500000.00, 'Geography'),
('Who proved Fermat''s Last Theorem?', '["Andrew Wiles", "Grigori Perelman", "Terence Tao", "Peter Scholze"]', 0, 14, 500000.00, 'Mathematics');

-- Level 15 Questions ($1,000,000)
INSERT INTO rotom_millionaire_questions (text, answers, correct_answer, difficulty_level, prize_value, category) VALUES
('What is the half-life of Carbon-14?', '["5,370 years", "5,730 years", "6,370 years", "6,730 years"]', 1, 15, 1000000.00, 'Science'),
('Which treaty ended the Thirty Years'' War?', '["Treaty of Utrecht", "Peace of Westphalia", "Treaty of Versailles", "Congress of Vienna"]', 1, 15, 1000000.00, 'History'),
('In Greek mythology, who was the father of the Titans?', '["Cronus", "Uranus", "Zeus", "Oceanus"]', 1, 15, 1000000.00, 'Mythology');
