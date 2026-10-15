import { describe,expect,it } from 'vitest';
import { readCatalog,readLearningTopic } from './education';
const summary={slug:'phishing',title:'Phishing',description:'Read safely',badge:'Belajar',level:'beginner',lessonCount:1,questionCount:1};
const detail={...summary,lessons:[{title:'Title',summary:'Summary',safe:'Do',risky:'Avoid'}],questions:[{prompt:'Q',options:['A','B'],answer:0,explanation:'Why'}]};
describe('learning response validation',()=>{
 it('accepts expected catalogue and topic',()=>{expect(readCatalog([summary])).toHaveLength(1);expect(readLearningTopic(detail,'phishing').lessonCount).toBe(1);});
 it.each([{},[summary,summary],[{...summary,level:'expert'}],[{...summary,slug:'../x'}],[{...summary,lessonCount:0}]])('rejects malformed catalogues',v=>expect(()=>readCatalog(v)).toThrow());
 it.each([{...detail,slug:'other'},{...detail,lessons:[]},{...detail,questions:[{...detail.questions[0],answer:2}]},{...detail,questions:[{...detail.questions[0],options:['A']}]},{...detail,lessons:[{}]}])('rejects invalid content and answer boundaries',v=>expect(()=>readLearningTopic(v,'phishing')).toThrow());
});
