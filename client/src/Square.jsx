function Square({ value, onClick }) {
    const className =
        value === "X"
            ? "square x"
            : value === "O"
            ? "square o"
            : "square";

    return (
        <button
            className={className}
            onClick={onClick}
        >
            {value}
        </button>
    );
}

export default Square;