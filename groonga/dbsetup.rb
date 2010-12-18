require 'rubygems'
require 'groonga'
require 'pathname'
$KCODE = 'utf-8'
Groonga::Context.default_options = {:encoding => :utf8}

BaseDir = Pathname.new(File.dirname(__FILE__))
DbPath  = BaseDir + 'db/docs.db'

unless DbPath.exist?
  Groonga::Database.create :path => DbPath.to_s

  docs = Groonga::Hash.create(:name => 'Docs', :key_type => 'ShortText')
  docs.define_column('rev',   'ShortText')
  docs.define_column('title', 'Text')
  docs.define_column('body',  'Text')

  terms = Groonga::Hash.create(:name => 'Terms', :key_type => 'ShortText', :default_tokenizer => 'TokenBigram')
  terms.define_index_column('docs_title', docs, :source => 'Docs.title')
  terms.define_index_column('docs_body',  docs, :source => 'Docs.body')
end




