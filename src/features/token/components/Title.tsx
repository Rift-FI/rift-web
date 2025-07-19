function Title({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-2 mx-2">
      <div className="flex items-center gap-2">
        <p className="text-[1.125rem] font-medium text-text-subtle">{title}</p>
      </div>
    </div>
  );
}

export default Title;
