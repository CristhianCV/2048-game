// Constants

const SQUARE_SIZE_AND_MARGIN = 108;
const GAME_ROWS = 4;
const GAME_COLUMNS = 4;

const STATUS = {
    PLAYING: "PLAYING",
    GAME_OVER: "GAME_OVER",
};

// Variables

let score = 0;

let best = 0;

let game_layout = [];

const MOVEMENT = {
    UP: "UP",
    DOWN: "DOWN",
    LEFT: "LEFT",
    RIGHT: "RIGHT",
};

let current_status = STATUS.PLAYING;

let tiles_to_delete = [];

// Exec

document.addEventListener("keydown", key_pressed);

load();

// Functions

function key_pressed(event) {
    switch (event.key) {
        case "ArrowDown":
            move(MOVEMENT.DOWN);
            break;
        case "ArrowUp":
            move(MOVEMENT.UP);
            break;
        case "ArrowLeft":
            move(MOVEMENT.LEFT);
            break;
        case "ArrowRight":
            move(MOVEMENT.RIGHT);
            break;
        case "R":
            init();
            break;
        case "r":
            init();
            break;
        default:
            return;
    }
}

function load() {
    const best_score = localStorage.getItem("best");
    if (best_score) {
        update_best(Number(best_score));
    } else {
        update_best(0);
    }

    init();
}

function init() {
    current_status = STATUS.PLAYING;

    set_content("tile_container", "");
    game_layout = [];

    for (let r = 0; r < GAME_ROWS; r++) {
        let array_row = Array(GAME_COLUMNS).fill(0);
        game_layout.push(array_row);
    }

    remove_class_by_id("game_message", "visible");

    generate_tile(2);
    generate_tile(2);
    generate_tile(2);

    tiles_to_delete = [];

    update_score(0);
}

function move(movement) {
    let added_score = 0;
    let moved = false;
    let finish_game = false;

    if (current_status === STATUS.GAME_OVER) {
        return;
    }

    for (let i = tiles_to_delete.length - 1; i >= 0; i--) {
        const divs = document.getElementsByClassName(tiles_to_delete[i]);
        for (let j = divs.length - 1; j >= 0; j--) {
            remove_child("tile_container", divs[j]);
        }
        tiles_to_delete.splice(i, 1);
    }

    let row_start = movement === MOVEMENT.DOWN ? game_layout.length - 1 : 0;
    let row_step = movement === MOVEMENT.DOWN ? -1 : 1;

    let column_start = movement === MOVEMENT.RIGHT ? game_layout[0].length - 1 : 0;
    let column_step = movement === MOVEMENT.RIGHT ? -1 : 1;

    let current_row = row_start;
    let current_column = column_start;

    while (current_row < game_layout.length && current_row >= 0) {
        current_column = column_start;

        while (current_column < game_layout[0].length && current_column >= 0) {
            if (game_layout[current_row][current_column] === 0) {
                current_column += column_step;
                continue;
            }

            // New place
            let new_row = current_row;
            let new_column = current_column;

            let last_void_row = current_row;
            let last_void_column = current_column;

            while (true) {
                if (movement === MOVEMENT.DOWN || movement === MOVEMENT.UP) {
                    last_void_row -= row_step;
                }

                if (movement === MOVEMENT.RIGHT || movement === MOVEMENT.LEFT) {
                    last_void_column -= column_step;
                }

                if (
                    last_void_row >= game_layout.length ||
                    last_void_row < 0 ||
                    last_void_column >= game_layout[0].length ||
                    last_void_column < 0 ||
                    game_layout[last_void_row][last_void_column] !== 0
                ) {
                    break;
                }

                new_row = last_void_row;
                new_column = last_void_column;
            }

            // Next tile
            let next_filled_row = current_row;
            let next_filled_column = current_column;

            while (true) {
                if (movement === MOVEMENT.DOWN || movement === MOVEMENT.UP) {
                    next_filled_row += row_step;
                }

                if (movement === MOVEMENT.RIGHT || movement === MOVEMENT.LEFT) {
                    next_filled_column += column_step;
                }

                if (
                    next_filled_row >= game_layout.length ||
                    next_filled_row < 0 ||
                    next_filled_column >= game_layout[0].length ||
                    next_filled_column < 0
                ) {
                    next_filled_row = null;
                    next_filled_column = null;
                    break;
                }

                if (game_layout[next_filled_row][next_filled_column] !== 0) {
                    break;
                }
            }

            const current_value = game_layout[current_row][current_column];

            if (next_filled_row != null && current_value === game_layout[next_filled_row][next_filled_column]) {
                const new_value = current_value * 2;
                tiles_to_delete.push(`tile_${new_row}_${new_column} number_${current_value}`);
                translate_tile(next_filled_row, next_filled_column, new_row, new_column);
                translate_tile(current_row, current_column, new_row, new_column);
                generate_tile(new_value, { row: new_row, column: new_column });
                finish_game = new_value === 2048 ? true : finish_game;
                added_score += new_value;
                moved = true;
            } else if (new_row !== current_row || new_column !== current_column) {
                translate_tile(current_row, current_column, new_row, new_column);
                moved = true;
            }

            current_column += column_step;
        }
        current_row += row_step;
    }

    if (moved === true) {
        update_score(score + added_score);

        if (finish_game) {
            current_status = STATUS.GAME_OVER;
            show_message("🎉 ¡LLEGASTE A 2048! 🎉");

            if (score > best) {
                update_best(score);
            }

            return;
        }

        generate_tile(2);

        if (can_move(movement) === false) {
            current_status = STATUS.GAME_OVER;
            show_message("GAME OVER");

            if (score > best) {
                update_best(score);
            }
        }
    }
}

function update_score(new_score) {
    score = new_score;
    set_content("score_value", score);
}

function update_best(new_best) {
    best = new_best;
    set_content("best_value", best);
    localStorage.setItem("best", new_best);
}

function can_move() {
    const empty_tiles = get_empty_tiles();
    if (empty_tiles.length > 0) {
        return true;
    }

    for (let r = 0; r < game_layout.length; r++) {
        for (let c = 0; c < game_layout[r].length; c++) {
            if (
                c + 1 <= game_layout[r].length - 1 &&
                (game_layout[r][c + 1] === 0 || game_layout[r][c + 1] === game_layout[r][c])
            ) {
                return true;
            }

            if (
                r + 1 <= game_layout.length - 1 &&
                (game_layout[r + 1][c] === 0 || game_layout[r + 1][c] === game_layout[r][c])
            ) {
                return true;
            }
        }
    }

    return false;
}

function translate_tile(r, c, new_r, new_c) {
    let div = document.getElementsByClassName(`tile_${r}_${c}`)[0];
    div.style.top = `${SQUARE_SIZE_AND_MARGIN * new_r}px`;
    div.style.left = `${SQUARE_SIZE_AND_MARGIN * new_c}px`;
    div.classList.remove(`tile_${r}_${c}`);
    div.classList.add(`tile_${new_r}_${new_c}`);

    game_layout[new_r][new_c] = game_layout[r][c];
    game_layout[r][c] = 0;
}

function generate_tile(number, position = null) {
    let row, column;

    if (position) {
        row = position.row;
        column = position.column;
    } else {
        let empty_tiles = get_empty_tiles();
        const random_tile = empty_tiles[Math.floor(Math.random() * empty_tiles.length)];
        row = random_tile.row;
        column = random_tile.column;
    }

    const div = document.createElement("div");
    div.textContent = number;
    div.style.top = `${SQUARE_SIZE_AND_MARGIN * row}px`;
    div.style.left = `${SQUARE_SIZE_AND_MARGIN * column}px`;
    div.classList.add("tile", `number_${number}`, `tile_${row}_${column}`);
    append_child("tile_container", div);

    game_layout[row][column] = number;
}

function show_message(message) {
    set_content("game_message", message);
    add_class_by_id("game_message", "visible");
}

// Utils

function add_class(class_name, new_class_name) {
    document.getElementsByClassName(class_name)[0].classList.add(new_class_name);
}

function remove_class(class_name, new_class_name) {
    document.getElementsByClassName(class_name)[0].classList.remove(new_class_name);
}

function add_class_by_id(id, new_class_name) {
    document.getElementById(id).classList.add(new_class_name);
}

function remove_class_by_id(id, new_class_name) {
    document.getElementById(id).classList.remove(new_class_name);
}

function set_content(id, content) {
    document.getElementById(id).textContent = content;
}

function append_child(id, child) {
    document.getElementById(id).appendChild(child);
}

function remove_child(id, child) {
    document.getElementById(id).removeChild(child);
}

function get_empty_tiles() {
    let empty_tiles = [];

    for (let r = 0; r < game_layout.length; r++) {
        for (let c = 0; c < game_layout[r].length; c++) {
            if (game_layout[r][c] === 0) {
                empty_tiles.push({ row: r, column: c });
            }
        }
    }

    return empty_tiles;
}
