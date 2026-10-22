type ActionPopupProps = {
  message: string;
  onClose: () => void;
};

function ActionPopup({ message, onClose}: ActionPopupProps) {
  return (
    <div className="delete-popup">
      {message}
      <button onClick={onClose}>×</button>
    </div>
  );
}

export default ActionPopup;
