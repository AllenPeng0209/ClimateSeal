import React from 'react';

const EXAMPLE_PROMPTS = [
  { text: '如何制作澳洲牛肉的碳排放报告？需要考虑哪些环节？' },
  { text: '请帮我分析电子产品的碳足迹，从原料到回收的完整生命週期' },
  { text: '制作建筑材料的碳排放报告，需要收集哪些数据？' },
  { text: '请帮我分析运输物流过程中的碳排放计算方法' },
  { text: '如何制作农产品的碳足迹报告？' },
  { text: '如何计算服务业的碳排放？以餐饮业为例' },
  { text: '制作零售商品的碳排放报告，需要哪些数据支持？' }
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="border border-bolt-elements-borderColor rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-3 py-1 text-xs transition-theme"
            >
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
