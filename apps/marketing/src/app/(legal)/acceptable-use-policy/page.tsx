
import { promises as fs } from 'fs';


export default async function PrivacyPage() {

    const file = await fs.readFile(process.cwd() + '/src/app/(legal)/acceptable-use-policy/content.html', 'utf8');

    return <div className="bg-white p-8" dangerouslySetInnerHTML={{ __html: file }} />;
}