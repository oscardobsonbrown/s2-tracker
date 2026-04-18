interface FooterProps {
  dictionary: {
    footer: {
      madeWith: string;
      and: string;
      by: string;
      follow: string;
      columns: {
        general: {
          title: string;
          home: string;
          docs: string;
        };
        legal: {
          title: string;
          privacy: string;
          terms: string;
          data: string;
        };
        editors: {
          title: string;
          cursor: string;
          copilot: string;
          claude: string;
          zed: string;
          windsurf: string;
          codeium: string;
          tabnine: string;
          continue: string;
          aider: string;
        };
        agents: {
          title: string;
          cursorComposer: string;
          amazonQ: string;
          codium: string;
          codewhisperer: string;
          sourcegraph: string;
          jetbrainsAi: string;
          replit: string;
          poolside: string;
          supermaven: string;
          lovable: string;
          v0: string;
          bolt: string;
          tempCode: string;
          blackbox: string;
          codegeeX: string;
          figmaCode: string;
          mintlify: string;
          staggered: string;
          stepsize: string;
          servicenow: string;
          codeiumWindsurf: string;
          pearAi: string;
          openaiCodex: string;
          geminiCodeAssist: string;
          devin: string;
          o1Assistant: string;
          chatgpt: string;
          youcom: string;
          phind: string;
          perplexity: string;
        };
      };
    };
  };
}

export function Footer({ dictionary }: FooterProps) {
  const { footer } = dictionary;
  const { columns } = footer;

  return (
    <footer className="border-[#E5E5E5] border-t px-4 py-[60px] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1056px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <span className="font-bold text-[18px] text-black">
                Next-Ship
              </span>
            </div>
            <p className="mb-4 text-[#666] text-[13px]">
              {footer.madeWith} ❤️ {footer.and} ☕ {footer.by}{" "}
              <a
                className="text-black hover:underline"
                href="https://twitter.com/yourusername"
                rel="noopener noreferrer"
                target="_blank"
              >
                @yourusername
              </a>
            </p>
            <p className="text-[#666] text-[13px]">
              {footer.follow}{" "}
              <a
                className="text-black hover:underline"
                href="https://twitter.com/yourusername"
                rel="noopener noreferrer"
                target="_blank"
              >
                𝕏
              </a>
            </p>
          </div>

          {/* General column */}
          <div>
            <h3 className="mb-4 font-semibold text-[13px] text-black">
              {columns.general.title}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  className="text-[#666] text-[13px] transition-colors hover:text-black"
                  href="/"
                >
                  {columns.general.home}
                </a>
              </li>
              <li>
                <a
                  className="text-[#666] text-[13px] transition-colors hover:text-black"
                  href="/docs"
                >
                  {columns.general.docs}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h3 className="mb-4 font-semibold text-[13px] text-black">
              {columns.legal.title}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  className="text-[#666] text-[13px] transition-colors hover:text-black"
                  href="/privacy"
                >
                  {columns.legal.privacy}
                </a>
              </li>
              <li>
                <a
                  className="text-[#666] text-[13px] transition-colors hover:text-black"
                  href="/terms"
                >
                  {columns.legal.terms}
                </a>
              </li>
              <li>
                <a
                  className="text-[#666] text-[13px] transition-colors hover:text-black"
                  href="/data"
                >
                  {columns.legal.data}
                </a>
              </li>
            </ul>
          </div>

          {/* Editors column */}
          <div>
            <h3 className="mb-4 font-semibold text-[13px] text-black">
              {columns.editors.title}
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.cursor}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.copilot}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.claude}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.zed}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.windsurf}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.codeium}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.tabnine}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.continue}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.editors.aider}
                </span>
              </li>
            </ul>
          </div>

          {/* Agents column */}
          <div>
            <h3 className="mb-4 font-semibold text-[13px] text-black">
              {columns.agents.title}
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.cursorComposer}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.amazonQ}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.codium}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.codewhisperer}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.sourcegraph}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.jetbrainsAi}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.replit}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.poolside}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.supermaven}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.lovable}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.v0}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.bolt}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.tempCode}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.blackbox}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.codegeeX}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.figmaCode}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.mintlify}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.staggered}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.stepsize}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.servicenow}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.codeiumWindsurf}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.pearAi}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.openaiCodex}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.geminiCodeAssist}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.devin}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.o1Assistant}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.chatgpt}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.youcom}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.phind}
                </span>
              </li>
              <li>
                <span className="text-[#666] text-[13px]">
                  {columns.agents.perplexity}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
