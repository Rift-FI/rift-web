function Title({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-8 mb-2 mx-2">
      <div className="flex items-center gap-2">
        <p className="text-xl font-semibold text-primary">{title}</p>
      </div>
    </div>
  );
}

export default Title;
