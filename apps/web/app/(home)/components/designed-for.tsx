type DesignedForProps = {
  dictionary: {
    designedFor: {
      title: string;
      description: string;
    };
  };
};

export function DesignedFor({ dictionary }: DesignedForProps) {
  return (
    <section className="px-4 py-[100px] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1056px]">
        {/* Title and description */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-[32px] text-black">
            {dictionary.designedFor.title}
          </h2>
          <p className="mx-auto max-w-[600px] text-[#666] text-[16px]">
            {dictionary.designedFor.description}
          </p>
        </div>

        {/* Large gray placeholder area */}
        <div className="h-[493px] w-full rounded-[10px] bg-[#F2F2F2]" />
      </div>
    </section>
  );
}
