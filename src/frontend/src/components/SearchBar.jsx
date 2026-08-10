function SearchBar({ search, setSearch }) {
  return (
    <div
      style={{
        marginBottom: "25px",
      }}
    >
      <input
        type="text"
        placeholder="🔍 Search by system, file, status or storage..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
          fontSize: "16px",
          outline: "none",
        }}
      />
    </div>
  );
}

export default SearchBar;